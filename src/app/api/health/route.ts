import { createRequestLog, logInfo } from "@/lib/logging/logger";

export async function GET(request: Request) {
  const requestLog = createRequestLog(request, "/api/health");

  logInfo({
    ...requestLog,
    message: "health.check",
    status: "ok",
    step: "health",
    metadata: {
      has_supabase_url: Boolean(
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
      has_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      has_openrouter_key: Boolean(process.env.OPENROUTER_API_KEY),
    },
  });

  return Response.json({
    ok: true,
    env: {
      hasSupabaseUrl: Boolean(
        process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
      ),
      hasSupabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
    },
  });
}
