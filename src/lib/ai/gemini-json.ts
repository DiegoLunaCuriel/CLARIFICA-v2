type GeminiOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
};

async function geminiRawText(prompt: string, options: GeminiOptions = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = options.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
    responseMimeType: "application/json",
  };

  // Limit thinking budget for Gemini 2.5 models to prioritize output tokens
  if (typeof options.thinkingBudget === "number") {
    generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig,
  };

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s
      const delay = attempt * 1000;
      console.log(`[gemini] Retry attempt ${attempt} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        cache: "no-store",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        const status = res.status;
        console.error(`[gemini] HTTP ERROR ${status} (attempt ${attempt + 1}/${maxRetries + 1}) model=${model}: ${txt.slice(0, 200)}`);
        // Retry on 429 (rate limit), 408 (timeout), 500+ (server errors)
        if ((status === 429 || status === 408 || status >= 500) && attempt < maxRetries) {
          lastError = new Error(`Gemini HTTP ${status}`);
          continue;
        }
        throw new Error(`Gemini HTTP ${status}: ${txt.slice(0, 300)}`);
      }

      const json = await res.json();

      const text: string =
        json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("") ?? "";

      if (!text.trim()) throw new Error("Gemini returned empty output");

      return text.trim();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries && (err?.message?.includes("HTTP 429") || err?.message?.includes("HTTP 5"))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Gemini request failed after retries");
}

function stripCodeFences(s: string) {
  return s
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractFirstJsonObject(s: string) {
  const t = stripCodeFences(s);
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}

async function repairJsonWithGemini(badJsonText: string, options: GeminiOptions = {}) {
  const repairPrompt =
    "Corrige el siguiente texto para que sea un JSON válido. " +
    "Devuelve SOLO el JSON corregido (sin markdown ni explicación).\n\n" +
    badJsonText;

  // Temperatura 0 para que "arregle" de forma determinista
  const repaired = await geminiRawText(repairPrompt, { ...options, temperature: 0 });
  return extractFirstJsonObject(repaired);
}

/* ── Image generation with Gemini 2.0 Flash ── */

export async function geminiGenerateImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = "gemini-2.0-flash-exp-image-generation";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.8,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[gemini-image] HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }

    const json = await res.json();
    const parts: any[] = json?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);

    if (!imagePart?.inlineData) {
      console.warn("[gemini-image] No image in response");
      return null;
    }

    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType || "image/png"};base64,${data}`;
  } catch (err: any) {
    console.error("[gemini-image] Error:", err?.message || err);
    return null;
  }
}

/* ── JSON generation ── */

export async function geminiGenerateJson<T>(prompt: string, options: GeminiOptions = {}): Promise<T> {
  // Reglas más estrictas para reducir errores desde la primera respuesta
  const strictPrompt =
    [
      "Devuelve SOLO un JSON válido.",
      "No uses markdown, no uses backticks, no uses texto extra.",
      "No incluyas comillas sin escapar dentro de strings.",
      "Idioma: español.",
      "",
      prompt,
    ].join("\n");

  const raw = await geminiRawText(strictPrompt, { ...options, temperature: options.temperature ?? 0 });

  const candidate = extractFirstJsonObject(raw);

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Segundo intento: reparar automáticamente con Gemini
    const repaired = await repairJsonWithGemini(candidate, options);
    return JSON.parse(repaired) as T;
  }
}
