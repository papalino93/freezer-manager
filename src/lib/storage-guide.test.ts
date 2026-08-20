import { describe, expect, it } from "vitest";
import { estimateConsumptionDate, STORAGE_GUIDE } from "./storage-guide";

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe("estimateConsumptionDate", () => {
  it("aggiunge normalmente i mesi quando il giorno esiste nel mese di arrivo", () => {
    const result = estimateConsumptionDate("CARNE", new Date("2026-01-15T00:00:00.000Z"));
    expect(iso(result.date)).toBe("2026-05-15"); // CARNE: 4 mesi
  });

  it("non trabocca nel mese successivo quando il giorno non esiste in arrivo (31 ago + 6 mesi)", () => {
    // Bug trovato durante l'audit: Date#setMonth "traboccava" al 3 marzo.
    const result = estimateConsumptionDate("ALTRO", new Date("2026-08-31T00:00:00.000Z"));
    expect(iso(result.date)).toBe("2027-02-28"); // ALTRO: 6 mesi, arrivo a febbraio non bisestile
  });

  it("nell'anno bisestile arriva al 29 febbraio, non si ferma al 28", () => {
    // GELATI/PIZZA: 2 mesi. 31 dicembre 2027 + 2 mesi cade a febbraio 2028,
    // che è bisestile: il giorno massimo disponibile è 29, non 28.
    const result = estimateConsumptionDate("GELATI", new Date("2027-12-31T00:00:00.000Z"));
    expect(iso(result.date)).toBe("2028-02-29");
  });

  it("30 novembre + 3 mesi finisce il 28 febbraio, non il 2 marzo", () => {
    const result = estimateConsumptionDate("PIATTI_PRONTI", new Date("2026-11-30T00:00:00.000Z"));
    expect(iso(result.date)).toBe("2027-02-28");
  });

  it("usa la durata giusta per ogni categoria", () => {
    const frozen = new Date("2026-01-01T00:00:00.000Z");
    expect(iso(estimateConsumptionDate("GELATI", frozen).date)).toBe("2026-03-01"); // 2 mesi
    expect(iso(estimateConsumptionDate("VERDURE", frozen).date)).toBe("2026-11-01"); // 10 mesi
  });

  it("ogni categoria della tabella ha un motivo dichiarato (mai una stima senza fonte)", () => {
    for (const guide of Object.values(STORAGE_GUIDE)) {
      expect(guide.reason.length).toBeGreaterThan(0);
      expect(guide.months).toBeGreaterThan(0);
    }
  });
});
