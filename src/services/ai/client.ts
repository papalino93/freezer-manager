import Anthropic from "@anthropic-ai/sdk";

// Punto di accesso unico all'AI. Il resto dell'app non sa nulla di
// "Anthropic", "Claude Vision" o simili: chiama solo le funzioni di
// services/ai. Cambiare provider/modello significa toccare solo questo
// file (punto 50 della specifica).
//
// La chiave non arriva mai al browser: questo modulo viene importato solo
// da route handler (App Router "/api/..."), che girano lato server.

let client: Anthropic | null = null;

export function getAiClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export const AI_MODEL = process.env.AI_MODEL || "claude-opus-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
