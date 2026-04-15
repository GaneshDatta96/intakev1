import { scorePatterns } from "@/lib/assessment/score-patterns";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { normalizedIntakeSchema } from "@/lib/schemas/intake";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const requestLog = createRequestLog(request, "/api/encounters/[id]/assess");

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "assessment",
    status: "started",
    encounter_id: id,
  });

  try {
    const body = await request.json();
    const normalizedIntake = normalizedIntakeSchema.parse(body.normalized_intake);
    const assessmentResults = scorePatterns(normalizedIntake);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      const deleteExisting = await supabase
        .from("assessment_results")
        .delete()
        .eq("encounter_id", id);

      if (deleteExisting.error) {
        throw deleteExisting.error;
      }

      const insertResults = await supabase.from("assessment_results").insert(
        assessmentResults.map((item) => ({
          encounter_id: id,
          pattern_key: item.pattern_key,
          confidence: item.confidence,
          evidence: item.evidence,
          data_gaps: item.data_gaps,
          risk_level: item.risk_level,
          rank: item.rank,
        })),
      );

      if (insertResults.error) {
        throw insertResults.error;
      }
    } else {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "assessment",
        status: "degraded",
        encounter_id: id,
      });
    }

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "assessment",
      status: "ok",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      metadata: {
        pattern_count: assessmentResults.length,
      },
    });

    return Response.json({
      assessmentResults,
    });
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "assessment",
      status: "error",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json(
      {
        error: "Unable to score assessment patterns.",
      },
      { status: 400 },
    );
  }
}
