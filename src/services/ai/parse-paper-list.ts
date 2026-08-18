import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AI_MODEL, getAiClient } from "@/services/ai/client";
import { parsedListSchema, type ParsedList } from "@/services/ai/schemas";
import { CATEGORIES } from "@/lib/categories";

export interface ParsePaperListInput {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

const categoryList = CATEGORIES.map((c) => `${c.value} (${c.label})`).join(", ");

const SYSTEM_PROMPT = `Sei un assistente che aiuta a trascrivere il foglio di carta su cui una persona annota a mano il contenuto del proprio congelatore, per importarlo in un'app.

Il foglio è scritto a mano, può avere righe disordinate, abbreviazioni, cancellature e grafia poco chiara. Ricostruisci una riga per ogni prodotto elencato.

Regole fondamentali:
- Trascrivi solo ciò che riesci davvero a leggere. Se un campo non è leggibile o non è presente su quella riga, restituisci null: non inventare mai nomi, quantità o date.
- Se hai dovuto interpretare un campo con incertezza (grafia poco chiara, abbreviazione ambigua), includine il nome in "uncertainFields" per quella riga (es. "expiryDate"), ma restituisci comunque il tuo miglior tentativo nel campo stesso. Se un campo è del tutto illeggibile, mettilo a null E aggiungilo a "uncertainFields".
- La categoria deve essere una di queste: ${categoryList}. Deducila dalla descrizione del prodotto.
- Le date vanno restituite in formato YYYY-MM-DD. Se sul foglio manca l'anno, assumi l'anno più plausibile in base al contesto (es. la data odierna è vicina), ma se è ambiguo aggiungi il campo a "uncertainFields".
- Non unire mai due righe diverse in una sola, anche se sembrano lo stesso prodotto: ogni riga del foglio è un prodotto distinto.
- Se una riga è stata chiaramente cancellata/barrata dall'utente (prodotto già consumato), non includerla nel risultato.`;

export async function parsePaperList(input: ParsePaperListInput): Promise<ParsedList> {
  const client = getAiClient();

  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          {
            type: "text",
            text: "Trascrivi tutti i prodotti elencati in questo foglio del congelatore.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(parsedListSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Non riesco a leggere bene il foglio. Prova a fare una foto più nitida.");
  }

  return response.parsed_output;
}
