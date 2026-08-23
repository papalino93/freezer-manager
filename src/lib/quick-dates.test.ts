import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayInputValue, daysAgoInputValue } from "./quick-dates";

describe("todayInputValue / daysAgoInputValue", () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "Europe/Rome";
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
    vi.useRealTimers();
  });

  it("usa il giorno di calendario LOCALE, non quello UTC", () => {
    // 21 agosto 00:30 ora locale (CEST, UTC+2) è ancora 20 agosto in UTC:
    // senza fissare il fuso qui, "Oggi" leggerebbe la data di ieri.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T22:30:00.000Z"));

    expect(todayInputValue()).toBe("2026-08-21");
  });

  it("daysAgoInputValue sottrae giorni di calendario locali", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T22:30:00.000Z")); // 21 agosto 00:30 locale

    expect(daysAgoInputValue(1)).toBe("2026-08-20");
  });
});
