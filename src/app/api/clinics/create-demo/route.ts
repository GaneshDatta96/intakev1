import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createDemoClinic } from "@/lib/clinics/store";
import {
  createRequestLog,
  logError,
  logInfo,
  logWarn,
} from "@/lib/logging/logger";
import { z } from "zod";

const createDemoSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  niche: z.string().trim().min(1),
  location: z.string().trim().optional(),
  country: z.string().trim().optional(),
  website: z.string().trim().optional(),
  description: z.string().trim().optional(),
  approach: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestLog = createRequestLog(request, "/api/clinics/create-demo");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "clinic_demo_create",
    status: "started",
  });

  try {
    const body = await request.json();
    const input = createDemoSchema.parse(body);
    const clinic = await createDemoClinic(input);
    const persisted = Boolean(getSupabaseAdmin()) && Boolean(clinic.id);

    if (!persisted) {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "clinic_demo_create",
        status: "degraded",
        latency_ms: Date.now() - startedAt,
        metadata: {
          clinic_slug: clinic.slug,
          niche: clinic.niche,
          persisted: false,
        },
      });
    }

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "clinic_demo_create",
      status: "ok",
      latency_ms: Date.now() - startedAt,
      metadata: {
        clinic_id: clinic.id ?? null,
        clinic_slug: clinic.slug,
        niche: clinic.niche,
        persisted,
      },
    });

    return Response.json(
      {
        clinic: {
          id: clinic.id,
          slug: clinic.slug,
          clinicName: clinic.clinicName,
          niche: clinic.niche,
          label: clinic.config.label,
        },
        validated: true,
        persisted,
      },
      { status: 201 },
    );
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "clinic_demo_create",
      status: "error",
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json(
      {
        error: "Unable to create demo clinic.",
      },
      { status: 400 },
    );
  }
}
