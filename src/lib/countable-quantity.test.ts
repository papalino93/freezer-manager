import { describe, expect, it } from "vitest";
import { parseCountableQuantity, formatCountableQuantity } from "./countable-quantity";

describe("parseCountableQuantity", () => {
  it("riconosce le unità separate comuni", () => {
    expect(parseCountableQuantity("5 scatole")).toEqual({
      count: 5,
      unitSingular: "scatola",
      rest: "",
    });
    expect(parseCountableQuantity("4 pezzi")).toEqual({ count: 4, unitSingular: "pezzo", rest: "" });
  });

  it("riconosce anche un numero puro", () => {
    expect(parseCountableQuantity("3")).toEqual({ count: 3, unitSingular: "", rest: "" });
  });

  it("NON scatta per peso/volume: lì 'consumarne una' non ha senso", () => {
    expect(parseCountableQuantity("1 kg")).toBeNull();
    expect(parseCountableQuantity("500 g")).toBeNull();
    expect(parseCountableQuantity("2 litri")).toBeNull();
  });

  it("non scatta con una sola unità: nulla da consumare 'parzialmente'", () => {
    expect(parseCountableQuantity("1 scatola")).toBeNull();
    expect(parseCountableQuantity("1")).toBeNull();
  });

  it("non scatta su testo libero senza un numero riconoscibile", () => {
    expect(parseCountableQuantity("porzione per 2")).toBeNull();
    expect(parseCountableQuantity(null)).toBeNull();
    expect(parseCountableQuantity("")).toBeNull();
  });
});

describe("formatCountableQuantity", () => {
  it("passa dal plurale al singolare scendendo a 1", () => {
    const chain = [5, 4, 3, 2, 1].map((count) =>
      formatCountableQuantity({ count, unitSingular: "scatola", rest: "" })
    );
    expect(chain).toEqual(["5 scatole", "4 scatole", "3 scatole", "2 scatole", "1 scatola"]);
  });

  it("un numero puro resta un numero puro", () => {
    expect(formatCountableQuantity({ count: 2, unitSingular: "", rest: "" })).toBe("2");
  });
});
