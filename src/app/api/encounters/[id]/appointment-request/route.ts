import { revalidatePath } from "next/cache";
import { storeAppointmentRequest } from "@/lib/intake/workflow";
import { createRequestLog, logError, logInfo, logWarn } from "@/lib/logging/logger";
import { appointmentRequestSchema } from "@/lib/schemas/intake";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const requestLog = createRequestLog(
    request,
    "/api/encounters/[id]/appointment-request",
  );

  logInfo({
    ...requestLog,
    message: "route.start",
    step: "appointment_request",
    status: "started",
    encounter_id: id,
  });

  try {
    const body = await request.json();
    const input = appointmentRequestSchema.parse(body);
    const stored = await storeAppointmentRequest(id, input);

    if (!stored.persisted) {
      logWarn({
        ...requestLog,
        message: "supabase.unavailable",
        step: "appointment_request",
        status: "degraded",
        encounter_id: id,
        metadata: {
          reason: "Missing Supabase env vars. Appointment request could not be persisted.",
        },
      });
    }

    revalidatePath("/dashboard");

    logInfo({
      ...requestLog,
      message: "route.complete",
      step: "appointment_request",
      status: "ok",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      metadata: {
        persisted: stored.persisted,
      },
    });

    return Response.json(stored);
  } catch (error) {
    logError({
      ...requestLog,
      message: "route.failed",
      step: "appointment_request",
      status: "error",
      encounter_id: id,
      latency_ms: Date.now() - startedAt,
      error,
    });

    return Response.json(
      {
        error: "Unable to request an appointment.",
      },
      { status: 400 },
    );
  }
}
