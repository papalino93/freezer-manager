import { NextRequest, NextResponse } from "next/server";
import { parsePaperList, isAiConfigured } from "@/services/ai";
import { parseImageDataUrl } from "@/lib/image-upload";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "L'importazione automatica non è disponibile al momento." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const image = typeof body?.image === "string" ? parseImageDataUrl(body.image) : null;
  if (!image) {
    return NextResponse.json({ error: "Foto non valida. Riprova." }, { status: 400 });
  }

  try {
    const result = await parsePaperList({
      imageBase64: image.base64,
      mediaType: image.mediaType,
    });
    return NextResponse.json({ result });
  } catch (err) {
    // Senza questo, una chiave scaduta o una quota esaurita restano
    // invisibili: ogni utente vede solo "riprova", per sempre.
    console.error("parse-list failed:", err);
    return NextResponse.json(
      { error: "Non riesco a leggere bene il foglio. Prova a fare una foto più nitida." },
      { status: 502 }
    );
  }
}
