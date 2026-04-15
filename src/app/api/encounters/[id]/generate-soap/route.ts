import { generateSoapDraft } from "@/lib/ai/generate-soap";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { normalizedIntakeSchema } from "@/lib/schemas/intake";
import { assessmentResultSchema } from "@/lib/schemas/soap";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const requestLog = createRequestLog(request, "/api/encounters/[id]/generate-soap");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "soap_generation",
    status: "started",
    encounter_id: id,
  });

  try {
    const body = await request.json();
    const normalizedIntake = normalizedIntakeSchema.parse(body.normalized_intake);
    const assessmentResults = assessmentResultSchema
      .array()
      .parse(body.assessment_results);
    const generated = await generateSoapDraft({
      intake: normalizedIntake,
      assessmentResults,
    });
    const supabase = getSupabaseAdmin();

    if (supabase) {
      const upsert = await supabase.from("soap_notes").upsert(
        {
          encounter_id: id,
          subjective: generated.soap.subjective,
          objective: generated.soap.objective,
          assessment: generated.soap.assessment,
          plan: generated.soap.plan_draft,
          soap_json: generated.soap,
          prompt_version: generated.promptVersion,
          model: generated.model,
          review_status: "draft",
        },
        {
          onConflict: "encounter_id",
        },
      );

      if (upsert.error) {
        throw upsert.error;
      }
    } else {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "soap_generation",
        status: "degraded",
        encounter_id: id,
      });
    }

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "soap_generation",
      status: "ok",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      model: generated.model,
      prompt_version: generated.promptVersion,
      token_usage: "tokenUsage" in generated ? generated.tokenUsage : null,
      metadata: {
        used_fallback: generated.usedFallback,
      },
    });

    return Response.json({
      soap: generated.soap,
      model: generated.model,
      promptVersion: generated.promptVersion,
      usedFallback: generated.usedFallback,
    });
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "soap_generation",
      status: "error",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json(
      {
        error: "Unable to generate SOAP draft.",
      },
      { status: 400 },
    );
  }
}
