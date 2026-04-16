import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { z } from "zod";

const createPatientSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestLog = createRequestLog(request, "/api/patients/create");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "patient_create",
    status: "started",
  });

  try {
    const body = await request.json();
    const { first_name, last_name, email } = createPatientSchema.parse(body);
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "patient_create",
        status: "degraded",
        latency_ms: Date.now() - startedAt,
        metadata: {
          reason: "Missing Supabase env vars. Returning ephemeral patient record.",
          persisted: false,
        },
      });

      return Response.json(
        {
          id: crypto.randomUUID(),
          first_name,
          last_name,
          email,
          created_at: new Date().toISOString(),
        },
        { status: 201 },
      );
    }

    const { data, error } = await supabase
      .from("patients")
      .insert([{ first_name, last_name, email }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "patient_create",
      status: "ok",
      latency_ms: Date.now() - startedAt,
      metadata: {
        persisted: true,
      },
    });

    return Response.json(data, { status: 201 });
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "patient_create",
      status: "error",
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json({ error: "Failed to create patient" }, { status: 400 });
  }
}
