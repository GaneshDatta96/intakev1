type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  message: string;
  request_id?: string;
  route?: string;
  step?: string;
  encounter_id?: string;
  status?: string;
  latency_ms?: number;
  model?: string;
  prompt_version?: string;
  token_usage?: unknown;
  metadata?: Record<string, unknown>;
};

function write(
  level: LogLevel,
  payload: LogPayload & {
    error?: {
      name: string;
      message: string;
    };
  },
) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...payload,
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  console.log(entry);
}

export function createRequestLog(request: Request, route: string) {
  return {
    request_id: request.headers.get("x-request-id") ?? crypto.randomUUID(),
    route,
  };
}

export function logInfo(payload: Omit<LogPayload, "level">) {
  write("info", payload);
}

export function logWarn(payload: Omit<LogPayload, "level">) {
  write("warn", payload);
}

export function logError(
  payload: LogPayload & {
    error: unknown;
  },
) {
  const error =
    payload.error instanceof Error
      ? { name: payload.error.name, message: payload.error.message }
      : { name: "UnknownError", message: "Unexpected error" };

  write("error", {
    ...payload,
    error,
  });
}
