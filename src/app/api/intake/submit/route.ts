import { revalidatePath } from "next/cache";
import { getClinicByNiche } from "@/lib/clinics/niche-configs";
import { getClinicForSlug } from "@/lib/clinics/store";
import { processIntakeSubmission } from "@/lib/intake/workflow";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import {
  buildNicheIntakeSubmissionSchema,
  nicheIntakeBaseSchema,
} from "@/lib/schemas/niche-intake";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestLog = createRequestLog(request, "/api/intake/submit");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "intake_pipeline",
    status: "started",
  });

  try {
    const body = await request.json();
    const baseInput = nicheIntakeBaseSchema.parse(body);
    const clinic =
      (await getClinicForSlug(baseInput.clinic_slug)) ?? getClinicByNiche(baseInput.niche);

    if (!clinic) {
      throw new Error("Unknown clinic configuration.");
    }

    const input = buildNicheIntakeSubmissionSchema(clinic.config).parse(body);
    const processed = await processIntakeSubmission(input);

    if (!processed.persisted) {
      logWarn({
        ...requestLog,
        message: "intake.persistence.degraded",
        step: "intake_pipeline",
        status: "degraded",
        metadata: {
          reason:
            "Submission completed with local workflow mode or without durable intake persistence.",
          clinic_slug: clinic.slug,
          niche: clinic.niche,
        },
      });
    }

    revalidatePath("/dashboard");

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "intake_pipeline",
      status: "ok",
      encounter_id: processed.encounterId ?? undefined,
      latency_ms: Date.now() - startedAt,
      model: processed.model,
      prompt_version: processed.promptVersion,
      token_usage: processed.tokenUsage ?? null,
      metadata: {
        clinic_slug: clinic.slug,
        niche: clinic.niche,
        persisted: processed.persisted,
        supports_appointments: processed.supportsAppointments,
        symptom_count: processed.normalizedIntake.symptoms.length,
        pattern_count: processed.assessmentResults.length,
        used_fallback: processed.usedFallback,
      },
    });

    return Response.json({
      encounterId: processed.encounterId,
      normalizedIntake: processed.normalizedIntake,
      assessmentResults: processed.assessmentResults,
      soap: processed.soap,
      clinic: {
        slug: clinic.slug,
        niche: clinic.niche,
        label: clinic.config.label,
      },
      persisted: processed.persisted,
      bookingEnabled: processed.supportsAppointments,
    });
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "intake_pipeline",
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
