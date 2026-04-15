import { normalizeIntakeSubmission } from "@/lib/assessment/normalize-intake";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { intakeFormSchema } from "@/lib/schemas/intake";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestLog = createRequestLog(request, "/api/intake/submit");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "intake_submit",
    status: "started",
  });

  try {
    const body = await request.json();
    const input = intakeFormSchema.parse(body);
    const normalizedIntake = normalizeIntakeSubmission(input);
    const encounterId = crypto.randomUUID();
    const patientId = crypto.randomUUID();
    const supabase = getSupabaseAdmin();
    let persisted = false;

    if (supabase) {
      const patientInsert = await supabase.from("patients").insert({
        id: patientId,
        first_name: normalizedIntake.patient_info.first_name,
        last_name: normalizedIntake.patient_info.last_name,
        dob: null,
        sex_at_birth: normalizedIntake.patient_info.sex_at_birth,
        gender_identity: normalizedIntake.patient_info.gender_identity,
        phone: normalizedIntake.patient_info.contact.phone,
        email: normalizedIntake.patient_info.contact.email,
      });

      if (patientInsert.error) {
        throw patientInsert.error;
      }

      const encounterInsert = await supabase.from("encounters").insert({
        id: encounterId,
        patient_id: patientId,
        status: "submitted",
        chief_complaint: normalizedIntake.chief_complaint.primary_issue,
        submitted_at: normalizedIntake.metadata.submitted_at,
      });

      if (encounterInsert.error) {
        throw encounterInsert.error;
      }

      const intakeInsert = await supabase.from("intake_submissions").insert({
        encounter_id: encounterId,
        schema_version: normalizedIntake.schema_version,
        raw_json: input,
        normalized_json: normalizedIntake,
      });

      if (intakeInsert.error) {
        throw intakeInsert.error;
      }

      persisted = true;
    } else {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "intake_submit",
        status: "degraded",
        metadata: {
          reason: "Missing Supabase env vars. Falling back to local workflow mode.",
        },
      });
    }

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "intake_submit",
      status: "ok",
      encounter_id: encounterId,
      latency_ms: Date.now() - startedAt,
      metadata: {
        persisted,
        symptom_count: normalizedIntake.symptoms.length,
      },
    });

    return Response.json({
      encounterId,
      normalizedIntake,
      persisted,
    });
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "intake_submit",
      status: "error",
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json(
      {
        error: "Unable to submit intake.",
      },
      { status: 400 },
    );
  }
}
