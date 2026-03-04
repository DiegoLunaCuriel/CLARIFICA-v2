import { PostgrestClient } from "@supabase/postgrest-js";

const POSTGREST_URL = process.env.POSTGREST_URL || "";
const POSTGREST_SCHEMA = process.env.POSTGREST_SCHEMA || "public";
const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || "";

function isJwt(token: string) {
  // JWT típico: header.payload.signature => 2 puntos
  return typeof token === "string" && token.split(".").length === 3;
}

export function createPostgrestClient(userTokenOrKey?: string) {
  if (!POSTGREST_URL) throw new Error("Missing POSTGREST_URL env var");

  const client = new PostgrestClient(POSTGREST_URL, {
    schema: POSTGREST_SCHEMA,
    fetch: (url, options) => {
      const urlStr = url instanceof URL ? url.toString() : String(url);
      const urlObj = new URL(urlStr, POSTGREST_URL);

      const columns = urlObj.searchParams.get("columns");
      if (columns && columns.includes('"')) {
        urlObj.searchParams.set("columns", columns.replace(/"/g, ""));
      }

      return fetch(urlObj.toString(), { ...options } as RequestInit);
    },
  });

  client.headers.set("Content-Type", "application/json");

  // Prioridad:
  // - Si nos pasan un token/key (userTokenOrKey), úsalo como apikey.
  // - Si no, usa POSTGREST_API_KEY (anon key).
  const apiKeyToUse = (userTokenOrKey && userTokenOrKey.trim()) || POSTGREST_API_KEY;

  if (apiKeyToUse) {
    client.headers.set("apikey", apiKeyToUse);
  }

  // Authorization Bearer SOLO cuando sea JWT real (sesión de usuario)
  if (userTokenOrKey && isJwt(userTokenOrKey)) {
    client.headers.set("Authorization", `Bearer ${userTokenOrKey}`);
  } else {
    // Evita que quede un Authorization inválido
    client.headers.delete("Authorization");
  }

  return client;
}
