import { describe, expect, it } from "vitest";
import { parseWeightQuantity, formatWeightQuantity, toBaseValue } from "./weight-quantity";

describe("parseWeightQuantity", () => {
  it("riconosce peso e volume nelle forme abbreviate comuni", () => {
    expect(parseWeightQuantity("2 kg")).toEqual({ valueBase: 2000, unit: "kg", family: "mass", rest: "" });
    expect(parseWeightQuantity("500g")).toEqual({ valueBase: 500, unit: "g", family: "mass", rest: "" });
    expect(parseWeightQuantity("1.5 l")).toEqual({ valueBase: 1500, unit: "l", family: "volume", rest: "" });
    expect(parseWeightQuantity("250 ml")).toEqual({ valueBase: 250, unit: "ml", family: "volume", rest: "" });
  });

  it("riconosce anche le parole intere italiane", () => {
    expect(parseWeightQuantity("2 litri")).toEqual({ valueBase: 2000, unit: "litri", family: "volume", rest: "" });
    expect(parseWeightQuantity("450 grammi")).toEqual({
      valueBase: 450,
      unit: "grammi",
      family: "mass",
      rest: "",
    });
    expect(parseWeightQuantity("33 cl")).toEqual({ valueBase: 330, unit: "cl", family: "volume", rest: "" });
  });

  it("accetta la virgola come separatore decimale", () => {
    expect(parseWeightQuantity("1,5 kg")).toEqual({ valueBase: 1500, unit: "kg", family: "mass", rest: "" });
  });

  it("NON scatta per quantità a unità separate", () => {
    expect(parseWeightQuantity("5 scatole")).toBeNull();
    expect(parseWeightQuantity("3")).toBeNull();
  });

  it("non scatta su testo libero senza un'unità riconoscibile", () => {
    expect(parseWeightQuantity("porzione per 2")).toBeNull();
    expect(parseWeightQuantity(null)).toBeNull();
    expect(parseWeightQuantity("")).toBeNull();
  });
});

describe("formatWeightQuantity", () => {
  it("riformatta nella stessa unità originale, arrotondando", () => {
    expect(formatWeightQuantity({ valueBase: 1700, unit: "kg", family: "mass", rest: "" })).toBe("1.7 kg");
    expect(formatWeightQuantity({ valueBase: 300, unit: "g", family: "mass", rest: "" })).toBe("300 g");
  });
});

describe("toBaseValue", () => {
  it("converte nella base solo se l'unità è della stessa famiglia", () => {
    expect(toBaseValue(300, "g", "mass")).toBe(300);
    expect(toBaseValue(1, "kg", "mass")).toBe(1000);
    expect(toBaseValue(300, "ml", "mass")).toBeNull();
  });

  it("torna null per un'unità non riconosciuta", () => {
    expect(toBaseValue(300, "pezzi", "mass")).toBeNull();
  });
});
