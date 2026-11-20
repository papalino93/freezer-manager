import { z } from "zod";

// Punto di accesso unico all'AI. Il resto dell'app non sa nulla di
// "Gemini" o simili: chiama solo le funzioni di services/ai. Cambiare
// provider/modello significa toccare solo questo file (punto 50 della
// specifica).
//
// Provider: Google Gemini, livello GRATUITO. Il progetto non deve mai costare
// nulla: la chiave va creata su Google AI Studio in un progetto Google Cloud
// SENZA fatturazione attiva. Così, finita la quota gratuita, Google risponde
// 429 invece di addebitare: l'utente vede "riprova o inserisci a mano".
//
// La chiave non arriva mai al browser: questo modulo viene importato solo
// da route handler (App Router "/api/..."), che girano lato server.

export const AI_MODEL = process.env.AI_MODEL || "gemini-3.6-flash";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface ImageInput {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

// Gemini accetta un sottoinsieme di JSON Schema: togliamo la chiave "$schema".
function jsonSchemaFor(schema: z.ZodType): Record<string, unknown> {
  const json: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete json.$schema;
  return json;
}

/**
 * Manda un'immagine e un testo a Gemini e restituisce la risposta già
 * validata con lo schema zod. Lancia un errore se la risposta non è valida.
 */
export async function generateStructured<S extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  image: ImageInput;
  schema: S;
  maxOutputTokens: number;
}): Promise<z.infer<S>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY mancante");

  const res = await fetch(`${BASE_URL}/${AI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: opts.image.mediaType, data: opts.image.imageBase64 } },
            { text: opts.prompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchemaFor(opts.schema),
        maxOutputTokens: opts.maxOutputTokens,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API: HTTP ${res.status} ${body.slice(0, 500)}`);
  }

  const json = await res.json();
  const text: unknown = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Gemini API: risposta senza testo — ${JSON.stringify(json).slice(0, 300)}`);
  }

  return opts.schema.parse(JSON.parse(text));
}
