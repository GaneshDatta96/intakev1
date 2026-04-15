import { revalidatePath } from "next/cache";
import { processIntakeSubmission } from "@/lib/intake/workflow";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { intakeFormSchema } from "@/lib/schemas/intake";

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
    const input = intakeFormSchema.parse(body);
    const processed = await processIntakeSubmission(input);

    if (!processed.persisted) {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "intake_pipeline",
        status: "degraded",
        metadata: {
          reason: "Missing Supabase env vars. Falling back to local workflow mode.",
        },
      });
    }

    revalidatePath("/dashboard");

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "intake_pipeline",
      status: "ok",
      encounter_id: processed.encounterId,
      latency_ms: Date.now() - startedAt,
      model: processed.model,
      prompt_version: processed.promptVersion,
      token_usage: processed.tokenUsage ?? null,
      metadata: {
        persisted: processed.persisted,
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
      persisted: processed.persisted,
      bookingEnabled: true,
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
