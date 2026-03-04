import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateImage } from "@/lib/ai/gemini-json";
import CrudOperations from "@/lib/crud-operations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const materialId = Number(body?.materialId);
    const name = String(body?.name || "").trim();
    const description = String(body?.description || "").trim();

    if (!materialId || !name) {
      return NextResponse.json(
        { success: false, error: "materialId and name are required" },
        { status: 400 }
      );
    }

    const prompt = [
      `Generate a single realistic product photograph of a construction/hardware material: "${name}".`,
      description ? `Description: ${description}.` : "",
      "Clean white background, hardware store catalog style.",
      "The product should be centered, well-lit, and clearly visible.",
      "IMPORTANT: Do NOT include any text, labels, watermarks, brand names, or words anywhere on the image. The image must contain ONLY the product itself on a white background, with absolutely zero text or typography of any kind.",
    ]
      .filter(Boolean)
      .join(" ");

    console.log(`[generate-thumbnail] Generating for material ${materialId}: "${name}"`);
    const dataUrl = await geminiGenerateImage(prompt);

    if (!dataUrl) {
      console.warn(`[generate-thumbnail] Failed to generate image for "${name}"`);
      return NextResponse.json({ success: false });
    }

    // Save to DB
    const writeToken =
      process.env.POSTGREST_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (writeToken) {
      try {
        const crud = new CrudOperations("materials", writeToken);
        await crud.update(materialId, { thumbnail_url: dataUrl });
        console.log(`[generate-thumbnail] Saved thumbnail for material ${materialId}`);
      } catch (dbErr: any) {
        console.error(`[generate-thumbnail] DB save failed:`, dbErr?.message);
        // Still return the image even if DB save fails
      }
    }

    return NextResponse.json({ success: true, thumbnail_url: dataUrl });
  } catch (err: any) {
    console.error("[generate-thumbnail] Error:", err?.message || err);
    return NextResponse.json({ success: false });
  }
}
