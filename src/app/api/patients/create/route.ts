import { getSupabaseAdmin } from "@/lib/db/supabase";
import { createRequestLog, logError, logInfo } from "@/lib/logging/logger";
import { z } from "zod";

const createPatientSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const requestLog = createRequestLog(request, "/api/patients/create");
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    logError({
      ...requestLog,
      message: "Supabase client not available",
      error: new Error("Supabase client not available"),
    });
    return new Response(JSON.stringify({ error: "Database connection failed" }), { status: 500 });
  }

  try {
    const body = await request.json();
    const { first_name, last_name, email } = createPatientSchema.parse(body);
    const { data, error } = await supabase
      .from("patients")
      .insert([{ first_name, last_name, email }])
      .select();

    if (error) {
      throw error;
    }

    logInfo({ ...requestLog, message: "Patient created successfully" });
    return new Response(JSON.stringify(data[0]), { status: 201 });
  } catch (error) {
    logError({ ...requestLog, error: error });
    return new Response(JSON.stringify({ error: "Failed to create patient" }), { status: 400 });
  }
}
