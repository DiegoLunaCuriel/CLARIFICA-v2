import { NextResponse } from "next/server";
import { createPostgrestClient } from "@/lib/postgrest";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.POSTGREST_URL = process.env.POSTGREST_URL ? "OK" : "MISSING";
  checks.POSTGREST_API_KEY = process.env.POSTGREST_API_KEY ? "OK" : "MISSING";
  checks.SERPER_API_KEY = process.env.SERPER_API_KEY ? "OK" : "MISSING";
  checks.GEMINI_API_KEY = process.env.GEMINI_API_KEY ? "OK" : "MISSING";
  checks.JWT_SECRET = process.env.JWT_SECRET ? "OK" : "MISSING";

  // Check Supabase connectivity
  try {
    const client = createPostgrestClient(process.env.POSTGREST_API_KEY);
    const { data, error } = await client
      .from("material_categories")
      .select("id")
      .limit(1);

    if (error) {
      checks.database = `ERROR: ${error.message}`;
    } else {
      checks.database = `OK (${Array.isArray(data) ? data.length : 0} rows)`;
    }
  } catch (err: any) {
    checks.database = `FAIL: ${err?.message || "connection error"}`;
  }

  const allOk = Object.values(checks).every((v) => v.startsWith("OK"));

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks },
    { status: allOk ? 200 : 503 }
  );
}
