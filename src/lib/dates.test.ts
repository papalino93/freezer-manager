import { describe, expect, it } from "vitest";
import { daysBetween, getFreshness, formatDateIt } from "./dates";

describe("daysBetween", () => {
  it("è 0 per lo stesso giorno, anche con orari diversi", () => {
    const morning = new Date("2026-08-20T02:00:00.000Z");
    const evening = new Date("2026-08-20T23:00:00.000Z");
    expect(daysBetween(morning, evening)).toBe(0);
  });

  it("conta i giorni interi in avanti e indietro", () => {
    const from = new Date("2026-08-20T12:00:00.000Z");
    expect(daysBetween(from, new Date("2026-08-25T00:00:00.000Z"))).toBe(5);
    expect(daysBetween(from, new Date("2026-08-15T00:00:00.000Z"))).toBe(-5);
  });
});

describe("getFreshness", () => {
  const today = new Date("2026-08-20T00:00:00.000Z");

  it("è 'none' senza nessuna data", () => {
    const result = getFreshness({ expiryDate: null, recommendedConsumptionDate: null }, today);
    expect(result.level).toBe("none");
    expect(result.daysLeft).toBeNull();
  });

  it("è 'red' se la scadenza è già passata", () => {
    const result = getFreshness(
      { expiryDate: new Date("2026-08-18T00:00:00.000Z"), recommendedConsumptionDate: null },
      today
    );
    expect(result.level).toBe("red");
    expect(result.label).toBe("Data superata");
  });

  it("è 'red' anche se scade proprio oggi", () => {
    const result = getFreshness(
      { expiryDate: new Date("2026-08-20T00:00:00.000Z"), recommendedConsumptionDate: null },
      today
    );
    expect(result.level).toBe("red");
    expect(result.label).toBe("Consuma oggi");
  });

  it("è 'orange' entro la soglia (14 giorni compresi)", () => {
    const result = getFreshness(
      { expiryDate: new Date("2026-09-03T00:00:00.000Z"), recommendedConsumptionDate: null },
      today
    );
    expect(result.daysLeft).toBe(14);
    expect(result.level).toBe("orange");
  });

  it("è 'green' appena oltre la soglia", () => {
    const result = getFreshness(
      { expiryDate: new Date("2026-09-04T00:00:00.000Z"), recommendedConsumptionDate: null },
      today
    );
    expect(result.daysLeft).toBe(15);
    expect(result.level).toBe("green");
  });

  it("preferisce la scadenza reale alla stima quando entrambe sono presenti", () => {
    const result = getFreshness(
      {
        expiryDate: new Date("2026-09-04T00:00:00.000Z"),
        recommendedConsumptionDate: new Date("2026-08-18T00:00:00.000Z"),
      },
      today
    );
    expect(result.label).not.toContain("Consumo consigliato");
  });

  it("usa il testo 'stima' solo quando manca una vera scadenza", () => {
    const result = getFreshness(
      { expiryDate: null, recommendedConsumptionDate: new Date("2026-08-18T00:00:00.000Z") },
      today
    );
    expect(result.level).toBe("red");
    expect(result.label).toBe("Consumo consigliato superato");
  });
});

describe("formatDateIt", () => {
  it("torna null senza data", () => {
    expect(formatDateIt(null)).toBeNull();
    expect(formatDateIt(undefined)).toBeNull();
  });

  it("mostra sempre la data UTC, non quella del fuso orario locale", () => {
    // Se la funzione non fissasse esplicitamente il fuso a UTC, un processo
    // con TZ locale indietro rispetto a UTC (qui simulato) leggerebbe
    // mezzanotte UTC come il giorno prima — esattamente il bug corretto
    // stasera dopo l'audit.
    const original = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatDateIt(new Date("2026-08-20T00:00:00.000Z"))).toBe("20/08/2026");
    } finally {
      process.env.TZ = original;
    }
  });
});
