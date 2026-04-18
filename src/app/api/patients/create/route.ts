import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { z } from "zod";

const createPatientSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  clinic_id: z.string().uuid().optional(),
  clinic_slug: z.string().trim().optional(),
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
    const { first_name, last_name, email, clinic_id, clinic_slug } =
      createPatientSchema.parse(body);
    const fallbackPatient = {
      id: crypto.randomUUID(),
      first_name,
      last_name,
      email,
      created_at: new Date().toISOString(),
    };
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
        fallbackPatient,
        { status: 201 },
      );
    }

    try {
      if (clinic_id) {
        const newSchemaInsert = await supabase
          .from("patients")
          .insert([
            {
              clinic_id,
              name: `${first_name} ${last_name}`.trim(),
              email,
              phone: null,
            },
          ])
          .select("id, name, email, created_at")
          .single();

        if (!newSchemaInsert.error && newSchemaInsert.data) {
          logInfo({
            ...requestLog,
            message: "route.complete",
            step: "patient_create",
            status: "ok",
            latency_ms: Date.now() - startedAt,
            metadata: {
              persisted: true,
              schema_mode: "tenant_patients",
              clinic_id,
              clinic_slug: clinic_slug ?? null,
            },
          });

          const [createdFirstName = first_name, ...rest] =
            newSchemaInsert.data.name?.trim().split(/\s+/) ?? [];

          return Response.json(
            {
              id: newSchemaInsert.data.id,
              first_name: createdFirstName,
              last_name: rest.join(" ") || last_name,
              email: newSchemaInsert.data.email ?? email,
              created_at: newSchemaInsert.data.created_at ?? new Date().toISOString(),
            },
            { status: 201 },
          );
        }
      }

      const { data, error } = await supabase
        .from("patients")
        .insert([{ first_name, last_name, email }])
        .select()
        .single();

      if (error || !data) {
        throw error ?? new Error("Patient insert failed.");
      }

      logInfo({
        ...requestLog,
        message: "route.complete",
        step: "patient_create",
        status: "ok",
        latency_ms: Date.now() - startedAt,
        metadata: {
          persisted: true,
          schema_mode: "legacy_patients",
          clinic_slug: clinic_slug ?? null,
        },
      });

      return Response.json(
        {
          id: data.id,
          first_name: data.first_name ?? first_name,
          last_name: data.last_name ?? last_name,
          email: data.email ?? email,
          created_at: data.created_at ?? new Date().toISOString(),
        },
        { status: 201 },
      );
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: "UnknownError", message: "Unexpected persistence error" };

      logWarn({
        ...requestLog,
        message: "patient.persist.fallback",
        step: "patient_create",
        status: "degraded",
        latency_ms: Date.now() - startedAt,
        metadata: {
          reason: "Patient insert failed. Returning ephemeral patient record.",
          persisted: false,
          clinic_slug: clinic_slug ?? null,
          error_name: normalizedError.name,
          error_message: normalizedError.message,
        },
      });

      return Response.json(fallbackPatient, { status: 201 });
    }
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
