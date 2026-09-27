import { describe, expect, it } from "vitest";
import { tokenize, type Lang, type TokenType } from "./highlight";

const join = (code: string, lang: Lang) => tokenize(code, lang).map((t) => t.text).join("");
const typesOf = (code: string, lang: Lang, type: TokenType) =>
  tokenize(code, lang)
    .filter((t) => t.type === type)
    .map((t) => t.text.trim());

describe("tokenize", () => {
  const samples: [Lang, string][] = [
    ["python", 'from laya import Router\nrouter = Router(preload=True)  # load all three\nr = router.predict(state, {"q": 1.5})\n'],
    ["json", '{"type": "choice", "criteria": ["a", "b"], "p": 0.94, "ok": true, "x": null}'],
    ["bash", 'laya "I was charged twice" --preset triage | jq .answers\npip install "laya[serve]"'],
    ["ts", 'const out = await agent.predict("charged twice", { d: { type: "choice" } }); // run'],
  ];

  it.each(samples)("covers every character (%s)", (lang, code) => {
    expect(join(code, lang)).toBe(code);
  });

  it("classifies python tokens", () => {
    const code = 'def f(x):\n    return None  # done\ns = "hi"';
    expect(typesOf(code, "python", "keyword")).toEqual(["def", "return"]);
    expect(typesOf(code, "python", "func")).toEqual(["f"]);
    expect(typesOf(code, "python", "literal")).toEqual(["None"]);
    expect(typesOf(code, "python", "comment")).toEqual(["# done"]);
    expect(typesOf(code, "python", "string")).toEqual(['"hi"']);
  });

  it("separates JSON keys from string values", () => {
    const code = '{"choice": "billing", "noul": 0.89}';
    expect(typesOf(code, "json", "key")).toEqual(['"choice"', '"noul"']);
    expect(typesOf(code, "json", "string")).toEqual(['"billing"']);
    expect(typesOf(code, "json", "number")).toEqual(["0.89"]);
  });

  it("marks shell flags", () => {
    expect(typesOf('laya "x" --preset triage --json', "bash", "keyword")).toEqual(["--preset", "--json"]);
  });

  it("passes plain text through", () => {
    expect(tokenize("anything <at> all", "text")).toEqual([{ type: "plain", text: "anything <at> all" }]);
  });
});
