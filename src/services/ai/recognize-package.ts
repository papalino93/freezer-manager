import { generateStructured } from "@/services/ai/client";
import { recognizedPackageSchema, type RecognizedPackage } from "@/services/ai/schemas";
import { CATEGORIES } from "@/lib/categories";

export interface RecognizePackageInput {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

const categoryList = CATEGORIES.map((c) => `${c.value} (${c.label})`).join(", ");

const SYSTEM_PROMPT = `Sei un assistente che aiuta a riconoscere prodotti alimentari surgelati a partire dalla foto di una confezione, per un'app che gestisce il congelatore di casa.

Regole fondamentali:
- Leggi solo quello che è davvero scritto o visibile nella foto. Se un dato non è leggibile o non è presente, restituisci null: non indovinare mai un nome, una marca o una data.
- La categoria deve essere una di queste: ${categoryList}. Scegli quella più adatta anche se il prodotto non è un caso ovvio.
- Le date vanno restituite in formato YYYY-MM-DD.
- Se la confezione non ha alcuna data di scadenza visibile, "expiryDate" è null e "expiryDateLegible" è true (perché semplicemente non c'è, non è che manca la lettura).
- Se invece la data c'è ma è sfocata/tagliata/illeggibile, "expiryDate" è null e "expiryDateLegible" è false, e aggiungi un warning tipo "Data di scadenza non riconosciuta".
- Scrivi i warning in italiano, brevi e comprensibili anche a una persona non esperta di tecnologia.`;

export async function recognizePackagePhoto(
  input: RecognizePackageInput
): Promise<RecognizedPackage> {
  const parsed = await generateStructured({
    system: SYSTEM_PROMPT,
    prompt: "Analizza questa foto di una confezione surgelata e restituisci i dati del prodotto.",
    image: input,
    schema: recognizedPackageSchema,
    maxOutputTokens: 2048,
  }).catch((err) => {
    console.error("Gemini:", err);
    return null;
  });

  if (!parsed) {
    throw new Error("Non riesco a leggere bene la foto. Riprova con più luce.");
  }

  return parsed;
}
