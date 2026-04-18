import express from "express";
import { DatabaseSync } from "node:sqlite";
import { randomInt, randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import rawNicheConfigs from "../niche_configs.json" with { type: "json" };

const questionnaireFieldSchema = z.discriminatedUnion("type", [
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("text"),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("select"),
    options: z.array(z.string().trim().min(1)).min(1),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("multi"),
    options: z.array(z.string().trim().min(1)).min(1),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("scale"),
    min: z.number().int(),
    max: z.number().int(),
  }),
]);

const nicheConfigSchema = z.object({
  label: z.string().trim().min(1),
  questionnaire: z.array(questionnaireFieldSchema).min(1),
  soap: z.object({
    S: z.array(z.string().trim()),
    O: z.array(z.string().trim()),
    A: z.array(z.string().trim()),
    P: z.array(z.string().trim()),
  }),
});

const nicheConfigs = z.record(z.string(), nicheConfigSchema).parse(rawNicheConfigs);

const runId = randomUUID();
const rootDir = process.cwd();
const config = {
  dbPath: resolve(rootDir, process.env.ORCHESTRATOR_DB_PATH ?? "leads.db"),
  errorLogPath: resolve(rootDir, process.env.ORCHESTRATOR_ERROR_LOG_PATH ?? "errors.log"),
  dashboardPort: readIntEnv("ORCHESTRATOR_DASHBOARD_PORT", 4010),
  maxWorkers: Math.min(Math.max(readIntEnv("ORCHESTRATOR_MAX_WORKERS", 3), 1), 3),
  emailLimit24Hours: Math.max(readIntEnv("ORCHESTRATOR_EMAIL_LIMIT_24H", 50), 1),
  idlePollMs: Math.max(readIntEnv("ORCHESTRATOR_IDLE_POLL_MS", 3000), 1000),
  lockTimeoutMs: Math.max(readIntEnv("ORCHESTRATOR_LOCK_TIMEOUT_MS", 30 * 60 * 1000), 60_000),
  workerMinDelayMs: 2_000,
  workerMaxDelayMs: 5_000,
  postDemoMinDelayMs: 3_000,
  postDemoMaxDelayMs: 10_000,
};

let isStopping = false;
let emailLimitPauseLogged = false;

function readIntEnv(name, fallback) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function writeLog(level, payload) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    run_id: runId,
    ...payload,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  console.log(entry);
}

function logInfo(payload) {
  writeLog("info", payload);
}

function logWarn(payload) {
  writeLog("warn", payload);
}

function logError(payload, error) {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
        }
      : {
          name: "UnknownError",
          message: "Unexpected error",
        };

  writeLog("error", {
    ...payload,
    error: normalizedError,
  });
}

function appendErrorStack(error, metadata = {}) {
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unexpected error");

  mkdirSync(dirname(config.errorLogPath), { recursive: true });

  appendFileSync(
    config.errorLogPath,
    `${JSON.stringify({
      ts: new Date().toISOString(),
      run_id: runId,
      ...metadata,
      name: normalizedError.name,
      message: normalizedError.message,
      stack: normalizedError.stack ?? normalizedError.message,
    })}\n`,
    "utf8",
  );
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function randomDelay(minMs, maxMs) {
  return randomInt(minMs, maxMs + 1);
}

function normalizeText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeUrl(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    return normalized;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function pickFirstPresent(...values) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function clampErrorMessage(message) {
  return message.length > 1_000 ? `${message.slice(0, 997)}...` : message;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getConfigForNiche(niche) {
  const localConfig = nicheConfigs[niche] ?? null;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return localConfig;
  }

  try {
    const { data, error } = await supabase
      .from("niche_configs")
      .select("config")
      .eq("niche", niche)
      .maybeSingle();

    if (!error && data?.config) {
      return nicheConfigSchema.parse(data.config);
    }
  } catch {
    return localConfig;
  }

  return localConfig;
}

async function createDemoClinic(input) {
  const nicheConfig = await getConfigForNiche(input.niche);

  if (!nicheConfig) {
    throw new Error(`No niche config found for "${input.niche}".`);
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      id: null,
      slug: input.slug,
      clinicName: input.name,
      niche: input.niche,
      label: nicheConfig.label,
      route: `/${input.slug}`,
      persisted: false,
    };
  }

  const { data, error } = await supabase
    .from("clinics")
    .insert({
      name: input.name,
      slug: input.slug,
      niche: input.niche,
      location: input.location ?? null,
      country: input.country ?? "United States",
      website: input.website ?? null,
      description: input.description ?? null,
      approach: input.approach ?? null,
      is_demo: true,
    })
    .select("id, name, slug, niche")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create demo clinic.");
  }

  return {
    id: data.id ?? null,
    slug: data.slug,
    clinicName: data.name,
    niche: data.niche,
    label: nicheConfig.label,
    route: `/${data.slug}`,
    persisted: true,
  };
}

function normalizeLead(row) {
  const leadId = row.id;
  const name = pickFirstPresent(row.name, row.clinic_name, row.company_name, row.business_name);
  const niche = pickFirstPresent(row.niche, row.specialty, row.category);
  const city = normalizeText(row.city);
  const state = normalizeText(row.state);
  const location =
    normalizeText(row.location) ??
    (city && state ? `${city}, ${state}` : city ?? null);
  const services = pickFirstPresent(
    row.services,
    row.service_lines,
    row.offerings,
    row.treatments,
    row.specialties,
  );
  const review = pickFirstPresent(
    row.review,
    row.summary,
    row.notes,
    row.clinic_review,
  );

  if (!name) {
    throw new Error(`Lead ${leadId} is missing a clinic name.`);
  }

  if (!niche) {
    throw new Error(`Lead ${leadId} is missing a niche.`);
  }

  const rawSlug = pickFirstPresent(row.slug, row.clinic_slug);
  const slugBase = slugify(rawSlug ?? name);

  if (!slugBase) {
    throw new Error(`Lead ${leadId} is missing a valid slug source.`);
  }

  return {
    id: leadId,
    name,
    slug: rawSlug ? slugBase : `${slugBase}-${leadId}`,
    niche,
    location,
    country: normalizeText(row.country) ?? "United States",
    website: normalizeUrl(row.website ?? row.url),
    description: normalizeText(row.description) ?? services,
    approach: normalizeText(row.approach) ?? review,
    email: normalizeText(row.email ?? row.contact_email),
  };
}

class LeadStore {
  constructor(dbPath) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL");
    this.db.exec("PRAGMA busy_timeout = 5000");
  }

  ensureSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        slug TEXT,
        niche TEXT,
        location TEXT,
        country TEXT,
        website TEXT,
        description TEXT,
        approach TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        sent_at TEXT,
        locked_at TEXT,
        demo_created_at TEXT,
        demo_clinic_id TEXT,
        demo_route TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const columns = this.db
      .prepare("SELECT name FROM pragma_table_info('leads')")
      .all()
      .map((row) => row.name);

    const columnSet = new Set(columns);
    const requiredColumns = new Map([
      ["name", "TEXT"],
      ["slug", "TEXT"],
      ["niche", "TEXT"],
      ["location", "TEXT"],
      ["country", "TEXT"],
      ["website", "TEXT"],
      ["description", "TEXT"],
      ["approach", "TEXT"],
      ["email", "TEXT"],
      ["status", "TEXT NOT NULL DEFAULT 'pending'"],
      ["attempt_count", "INTEGER NOT NULL DEFAULT 0"],
      ["error_message", "TEXT"],
      ["sent_at", "TEXT"],
      ["locked_at", "TEXT"],
      ["demo_created_at", "TEXT"],
      ["demo_clinic_id", "TEXT"],
      ["demo_route", "TEXT"],
      ["created_at", "TEXT"],
      ["updated_at", "TEXT"],
    ]);

    for (const [name, definition] of requiredColumns) {
      if (!columnSet.has(name)) {
        this.db.exec(`ALTER TABLE leads ADD COLUMN ${name} ${definition}`);
      }
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_status_created_at
      ON leads (status, created_at, id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_sent_at
      ON leads (sent_at)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_status_locked_at
      ON leads (status, locked_at)
    `);
  }

  recoverStaleProcessingRows(lockTimeoutMs) {
    const cutoffIso = new Date(Date.now() - lockTimeoutMs).toISOString();
    const result = this.db
      .prepare(`
        UPDATE leads
        SET status = 'pending',
            locked_at = NULL,
            updated_at = ?,
            error_message = CASE
              WHEN error_message IS NULL OR error_message = ''
              THEN 'Recovered stale processing lock.'
              ELSE error_message
            END
        WHERE status = 'processing_demo'
          AND locked_at IS NOT NULL
          AND datetime(locked_at) <= datetime(?)
      `)
      .run(new Date().toISOString(), cutoffIso);

    return Number(result.changes ?? 0);
  }

  claimNextPendingLead() {
    return (
      this.db
        .prepare(`
          UPDATE leads
          SET status = 'processing_demo',
              locked_at = ?,
              updated_at = ?,
              error_message = NULL
          WHERE id = (
            SELECT id
            FROM leads
            WHERE status = 'pending'
            ORDER BY COALESCE(datetime(created_at), datetime('now')) ASC, id ASC
            LIMIT 1
          )
          RETURNING *
        `)
        .get(new Date().toISOString(), new Date().toISOString()) ?? null
    );
  }

  markLeadReady(leadId, demo) {
    this.db
      .prepare(`
        UPDATE leads
        SET status = 'demo_ready',
            error_message = NULL,
            locked_at = NULL,
            demo_created_at = ?,
            demo_clinic_id = ?,
            demo_route = ?,
            updated_at = ?
        WHERE id = ?
      `)
      .run(
        new Date().toISOString(),
        demo.id,
        demo.route,
        new Date().toISOString(),
        leadId,
      );
  }

  markLeadFailed(leadId, errorMessage) {
    this.db
      .prepare(`
        UPDATE leads
        SET status = 'failed',
            error_message = ?,
            attempt_count = COALESCE(attempt_count, 0) + 1,
            locked_at = NULL,
            updated_at = ?
        WHERE id = ?
      `)
      .run(clampErrorMessage(errorMessage), new Date().toISOString(), leadId);
  }

  getEmailWindowStats() {
    const sentCountRow = this.db
      .prepare(`
        SELECT COUNT(*) AS count
        FROM leads
        WHERE sent_at IS NOT NULL
          AND datetime(sent_at) >= datetime('now', '-24 hours')
      `)
      .get();

    const oldestSentRow = this.db
      .prepare(`
        SELECT sent_at
        FROM leads
        WHERE sent_at IS NOT NULL
          AND datetime(sent_at) >= datetime('now', '-24 hours')
        ORDER BY datetime(sent_at) ASC
        LIMIT 1
      `)
      .get();

    const sentCount = Number(sentCountRow?.count ?? 0);

    return {
      sentCount,
      limit: config.emailLimit24Hours,
      remaining: Math.max(config.emailLimit24Hours - sentCount, 0),
      oldestSentAtInWindow: oldestSentRow?.sent_at ?? null,
      isPaused: sentCount >= config.emailLimit24Hours,
    };
  }

  getCountsByStatus() {
    const rows = this.db
      .prepare(`
        SELECT COALESCE(status, 'unknown') AS status, COUNT(*) AS count
        FROM leads
        GROUP BY COALESCE(status, 'unknown')
        ORDER BY status ASC
      `)
      .all();

    return rows.reduce((accumulator, row) => {
      accumulator[row.status] = Number(row.count ?? 0);
      return accumulator;
    }, {});
  }

  getTotalLeadCount() {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM leads").get();
    return Number(row?.count ?? 0);
  }

  getFailedRows(limit = 100) {
    return this.db
      .prepare(`
        SELECT
          id,
          name,
          slug,
          niche,
          attempt_count,
          error_message,
          status,
          demo_route,
          updated_at,
          created_at
        FROM leads
        WHERE status = 'failed'
        ORDER BY COALESCE(datetime(updated_at), datetime(created_at)) DESC, id DESC
        LIMIT ?
      `)
      .all(limit);
  }

  close() {
    this.db.close();
  }
}

class WorkerPool {
  constructor(store) {
    this.store = store;
    this.workerStates = new Map();

    for (let workerId = 1; workerId <= config.maxWorkers; workerId += 1) {
      this.setWorkerState(workerId, "idle");
    }
  }

  setWorkerState(workerId, state, metadata = {}) {
    this.workerStates.set(String(workerId), {
      worker_id: workerId,
      state,
      updated_at: new Date().toISOString(),
      ...metadata,
    });
  }

  getWorkerSnapshot() {
    return Array.from(this.workerStates.values()).sort(
      (left, right) => left.worker_id - right.worker_id,
    );
  }

  async start() {
    const workerPromises = [];

    for (let workerId = 1; workerId <= config.maxWorkers; workerId += 1) {
      workerPromises.push(this.runWorker(workerId));
    }

    await Promise.all(workerPromises);
  }

  async runWorker(workerId) {
    logInfo({
      message: "worker.started",
      step: "orchestrator_worker",
      status: "started",
      metadata: {
        worker_id: workerId,
      },
    });

    while (!isStopping) {
      try {
        const emailWindow = this.store.getEmailWindowStats();
        this.handleEmailLimitLogging(emailWindow);

        if (emailWindow.isPaused) {
          this.setWorkerState(workerId, "paused_email_limit", {
            sent_last_24h: emailWindow.sentCount,
            limit: emailWindow.limit,
          });
          await sleep(config.idlePollMs);
          continue;
        }

        const claimedLead = this.store.claimNextPendingLead();

        if (!claimedLead) {
          this.setWorkerState(workerId, "waiting_for_lead");
          await sleep(config.idlePollMs);
          continue;
        }

        try {
          const normalizedLead = normalizeLead(claimedLead);
          this.setWorkerState(workerId, "processing_demo", {
            lead_id: normalizedLead.id,
            lead_slug: normalizedLead.slug,
          });

          logInfo({
            message: "lead.claimed",
            step: "orchestrator_worker",
            status: "processing_demo",
            metadata: {
              worker_id: workerId,
              lead_id: normalizedLead.id,
              lead_slug: normalizedLead.slug,
            },
          });

          const demo = await createDemoClinic(normalizedLead);

          this.store.markLeadReady(normalizedLead.id, demo);

          logInfo({
            message: "lead.demo_ready",
            step: "orchestrator_worker",
            status: "demo_ready",
            metadata: {
              worker_id: workerId,
              lead_id: normalizedLead.id,
              lead_slug: normalizedLead.slug,
              demo_route: demo.route,
              persisted: demo.persisted,
            },
          });

          this.setWorkerState(workerId, "post_demo_delay", {
            lead_id: normalizedLead.id,
            demo_route: demo.route,
          });
          await sleep(randomDelay(config.postDemoMinDelayMs, config.postDemoMaxDelayMs));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unexpected lead processing failure.";

          this.store.markLeadFailed(claimedLead.id, errorMessage);
          appendErrorStack(error, {
            step: "orchestrator_worker",
            worker_id: workerId,
            lead_id: claimedLead.id,
          });
          logError(
            {
              message: "lead.failed",
              step: "orchestrator_worker",
              status: "error",
              metadata: {
                worker_id: workerId,
                lead_id: claimedLead.id,
                lead_slug: claimedLead.slug ?? null,
              },
            },
            error,
          );
        }

        if (isStopping) {
          break;
        }

        this.setWorkerState(workerId, "between_task_delay");
        await sleep(randomDelay(config.workerMinDelayMs, config.workerMaxDelayMs));
        this.setWorkerState(workerId, "idle");
      } catch (error) {
        appendErrorStack(error, {
          step: "orchestrator_worker",
          worker_id: workerId,
        });
        logError(
          {
            message: "worker.loop_failed",
            step: "orchestrator_worker",
            status: "error",
            metadata: {
              worker_id: workerId,
            },
          },
          error,
        );
        this.setWorkerState(workerId, "recovering_from_error");
        await sleep(config.idlePollMs);
      }
    }

    this.setWorkerState(workerId, "stopped");
    logInfo({
      message: "worker.stopped",
      step: "orchestrator_worker",
      status: "stopped",
      metadata: {
        worker_id: workerId,
      },
    });
  }

  handleEmailLimitLogging(emailWindow) {
    if (emailWindow.isPaused && !emailLimitPauseLogged) {
      emailLimitPauseLogged = true;
      logWarn({
        message: "email.limit.reached",
        step: "orchestrator_limit",
        status: "paused",
        metadata: {
          sent_last_24h: emailWindow.sentCount,
          limit: emailWindow.limit,
          oldest_sent_at_in_window: emailWindow.oldestSentAtInWindow,
        },
      });
      return;
    }

    if (!emailWindow.isPaused && emailLimitPauseLogged) {
      emailLimitPauseLogged = false;
      logInfo({
        message: "email.limit.cleared",
        step: "orchestrator_limit",
        status: "resumed",
        metadata: {
          sent_last_24h: emailWindow.sentCount,
          limit: emailWindow.limit,
          remaining: emailWindow.remaining,
        },
      });
    }
  }
}

function buildDashboard(store, workerPool) {
  const app = express();

  app.use((request, response, next) => {
    const startedAt = Date.now();

    response.on("finish", () => {
      logInfo({
        message: "dashboard.request",
        route: request.path,
        step: "orchestrator_dashboard",
        status: response.statusCode >= 500 ? "error" : "ok",
        latency_ms: Date.now() - startedAt,
        metadata: {
          method: request.method,
          status_code: response.statusCode,
        },
      });
    });

    next();
  });

  app.get("/stats", (_request, response) => {
    const emailWindow = store.getEmailWindowStats();

    response.json({
      run_id: runId,
      db_path: config.dbPath,
      counts: store.getCountsByStatus(),
      total_leads: store.getTotalLeadCount(),
      email_window: emailWindow,
      workers: workerPool.getWorkerSnapshot(),
      generated_at: new Date().toISOString(),
    });
  });

  app.get("/errors", (request, response) => {
    const limit = Number.parseInt(String(request.query.limit ?? "100"), 10);

    response.json({
      run_id: runId,
      failed_rows: store.getFailedRows(Number.isFinite(limit) ? Math.max(limit, 1) : 100),
      generated_at: new Date().toISOString(),
    });
  });

  app.use((error, _request, response, _next) => {
    void _next;

    appendErrorStack(error, {
      step: "orchestrator_dashboard",
      route: "express_error_handler",
    });
    logError(
      {
        message: "dashboard.failed",
        step: "orchestrator_dashboard",
        status: "error",
      },
      error,
    );

    response.status(500).json({
      error: "Dashboard request failed.",
    });
  });

  return app;
}

async function startDashboardServer(app) {
  return await new Promise((resolvePromise) => {
    const server = app.listen(config.dashboardPort, () => {
      logInfo({
        message: "dashboard.started",
        step: "orchestrator_dashboard",
        status: "started",
        metadata: {
          port: config.dashboardPort,
        },
      });
      resolvePromise(server);
    });

    server.on("error", (error) => {
      appendErrorStack(error, {
        step: "orchestrator_dashboard",
        port: config.dashboardPort,
      });
      logError(
        {
          message: "dashboard.start_failed",
          step: "orchestrator_dashboard",
          status: "error",
          metadata: {
            port: config.dashboardPort,
          },
        },
        error,
      );
      resolvePromise(null);
    });
  });
}

async function stopDashboardServer(server) {
  if (!server) {
    return;
  }

  await new Promise((resolvePromise) => {
    server.close(() => resolvePromise());
  });
}

function installProcessHandlers() {
  process.on("unhandledRejection", (error) => {
    appendErrorStack(error, {
      step: "process.unhandled_rejection",
    });
    logError(
      {
        message: "process.unhandled_rejection",
        step: "process_runtime",
        status: "error",
      },
      error,
    );
  });

  process.on("uncaughtException", (error) => {
    appendErrorStack(error, {
      step: "process.uncaught_exception",
    });
    logError(
      {
        message: "process.uncaught_exception",
        step: "process_runtime",
        status: "error",
      },
      error,
    );
  });
}

async function main() {
  installProcessHandlers();

  const store = new LeadStore(config.dbPath);
  const workerPool = new WorkerPool(store);
  let dashboardServer = null;

  const requestShutdown = async (signal) => {
    if (isStopping) {
      return;
    }

    isStopping = true;
    logInfo({
      message: "orchestrator.shutdown_requested",
      step: "orchestrator_runtime",
      status: "stopping",
      metadata: {
        signal,
      },
    });
    await stopDashboardServer(dashboardServer);
  };

  process.on("SIGINT", () => {
    void requestShutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void requestShutdown("SIGTERM");
  });

  try {
    store.ensureSchema();
    const recoveredRows = store.recoverStaleProcessingRows(config.lockTimeoutMs);

    logInfo({
      message: "orchestrator.started",
      step: "orchestrator_runtime",
      status: "started",
      metadata: {
        db_path: config.dbPath,
        max_workers: config.maxWorkers,
        email_limit_24h: config.emailLimit24Hours,
        recovered_stale_rows: recoveredRows,
      },
    });

    const app = buildDashboard(store, workerPool);
    dashboardServer = await startDashboardServer(app);

    await workerPool.start();
  } finally {
    await stopDashboardServer(dashboardServer);
    store.close();

    logInfo({
      message: "orchestrator.stopped",
      step: "orchestrator_runtime",
      status: "stopped",
    });
  }
}

main().catch((error) => {
  appendErrorStack(error, {
    step: "orchestrator_runtime",
  });
  logError(
    {
      message: "orchestrator.crashed",
      step: "orchestrator_runtime",
      status: "error",
    },
    error,
  );
  process.exitCode = 1;
});
