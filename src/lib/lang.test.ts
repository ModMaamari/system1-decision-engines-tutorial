import { describe, expect, it } from "vitest";
import { analyse, englishFromCode, latinProfile, route, scriptCounts } from "./lang";

describe("script detection", () => {
  it("counts letters by script", () => {
    const c = scriptCounts("abc डुप्लिकेट");
    expect(c.latin).toBe(3);
    expect(c.devanagari).toBeGreaterThan(3);
  });

  it("counts letters of unlisted scripts as 'other', never as Latin", () => {
    expect(scriptCounts("ᚠᚢᚦ").other).toBe(3); // runic is not in the range table
  });
});

describe("route (README examples)", () => {
  it("sends Devanagari to the multilingual checkpoint with Laya's reason", () => {
    const r = route("मुझसे मार्च में दो बार शुल्क लिया गया, कृपया डुप्लिकेट राशि वापस करें।");
    expect(r.model).toBe("multilingual");
    expect(r.reason).toMatch(/^non-Latin script \(devanagari, 100% of letters\); the English checkpoint cannot read it$/);
  });

  it("sends English to the English checkpoint", () => {
    const r = route("Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan.");
    expect(r.model).toBe("english");
    expect(r.reason).toBe("English Latin text");
  });

  it("detects German from function words", () => {
    const r = route("Der Kunde wurde zweimal belastet und möchte das Geld zurück");
    expect(r.model).toBe("multilingual");
    expect(r.reason).toBe("Latin script but language looks like 'de', not English");
  });

  it("detects Spanish", () => {
    expect(route("La aplicación se cierra cada vez que abro la configuración.").model).toBe("multilingual");
  });

  it("sends short, unidentifiable Latin text to the default", () => {
    expect(route("Esqueci minha senha").reason).toMatch(/language not identified and no non-English letters; using default \(english\)/);
    expect(route("Esqueci minha senha", { defaultModel: "multilingual" }).model).toBe("multilingual");
  });

  it("uses the default when there are no letters", () => {
    expect(route("12345 !!!").reason).toBe("no letters detected in state; using default (english)");
  });

  it("honours explicit model and lang before detection", () => {
    expect(route("Hello there", { model: "typed-decisions" }).reason).toBe("explicit model='typed-decisions'");
    expect(route("Hello there", { lang: "ro" }).model).toBe("multilingual");
    expect(route("Bonjour", { lang: "en_US.UTF-8" }).model).toBe("english");
    // C.UTF-8 abstains, so detection decides
    expect(route("Hello there my friend, how are you", { lang: "C.UTF-8" }).step).toBe("detection");
  });
});

describe("parity with laya.router.Router().route (outputs recorded from the Python library)", () => {
  const cases: [string, string, string][] = [
    ["La aplicación se cierra cada vez que abro la configuración.", "multilingual", "Latin script, language not identified but 3% non-English letters; not safe for the English checkpoint"],
    ["Zażółć gęślą jaźń, proszę bardzo", "multilingual", "Latin script, language not identified but 31% non-English letters; not safe for the English checkpoint"],
    ["Esqueci minha senha", "english", "Latin script, language not identified and no non-English letters; using default (english)"],
    // The README's own example of a limit: short Romanian with no word-list evidence reads as English.
    ["Care este ora in Tokyo?", "english", "English Latin text"],
  ];
  it.each(cases)("%s", (text, model, reason) => {
    const r = route(text);
    expect(r.model).toBe(model);
    expect(r.reason).toBe(reason);
  });
});

describe("helpers", () => {
  it("reads language codes like _english_from_code", () => {
    expect(englishFromCode("en")).toBe(true);
    expect(englishFromCode("en-GB")).toBe(true);
    expect(englishFromCode("de")).toBe(false);
    expect(englishFromCode("und")).toBeNull();
    expect(englishFromCode("  ")).toBeNull();
  });

  it("needs a word of the language's own before naming it", () => {
    // 'la' and 'e' are shared by several lists, so they name no language by themselves.
    expect(latinProfile("la e la e la e").language).toBeNull();
  });

  it("marks a high diacritic rate as non-English", () => {
    const d = analyse("Zażółć gęślą jaźń, proszę bardzo");
    expect(d.isEnglish).toBe(false);
  });
});
