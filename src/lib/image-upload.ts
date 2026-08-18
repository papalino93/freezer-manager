const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

const MAX_BASE64_LENGTH = 12_000_000; // ~9MB di immagine decodificata

/**
 * Legge una data URL ("data:image/jpeg;base64,...") inviata dal form di
 * upload e la trasforma nei campi che si aspetta l'SDK di Anthropic.
 * Ritorna null se il formato non è quello che ci aspettiamo, così le route
 * possono rispondere con un errore comprensibile invece di un crash.
 */
export function parseImageDataUrl(
  dataUrl: string
): { base64: string; mediaType: AllowedMediaType } | null {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  const [, mediaType, base64] = match;
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType as AllowedMediaType)) return null;
  if (base64.length > MAX_BASE64_LENGTH) return null;

  return { base64, mediaType: mediaType as AllowedMediaType };
}
