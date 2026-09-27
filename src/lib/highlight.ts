/**
 * A small regex lexer for the code samples in the tutorial (Python, JSON, shell, TypeScript).
 * It only has to colour short, well-formed snippets, so it trades completeness for size: every
 * character of the input ends up in exactly one token, which the tests check.
 */
export type TokenType = "comment" | "string" | "number" | "keyword" | "func" | "key" | "literal" | "punct" | "plain";

export interface Token {
  type: TokenType;
  text: string;
}

export type Lang = "python" | "json" | "bash" | "ts" | "text";

type Rule = [TokenType, RegExp];

const WS: Rule = ["plain", /\s+/y];
const IDENT: Rule = ["plain", /[A-Za-z_$][\w$]*/y];
const PUNCT: Rule = ["punct", /[^\s\w]/y];
const NUMBER: Rule = ["number", /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y];

const RULES: Record<Exclude<Lang, "text">, Rule[]> = {
  python: [
    WS,
    ["comment", /#[^\n]*/y],
    ["string", /[rbfRBF]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?''')/y],
    ["string", /[rbfRBF]{0,2}(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/y],
    ["literal", /\b(?:None|True|False)\b/y],
    [
      "keyword",
      /\b(?:def|return|if|elif|else|for|in|while|import|from|as|class|with|try|except|finally|raise|lambda|and|or|not|is|pass|yield|async|await|break|continue|del|assert|global)\b/y,
    ],
    NUMBER,
    ["func", /[A-Za-z_]\w*(?=\()/y],
    IDENT,
    PUNCT,
  ],
  json: [
    WS,
    ["key", /"(?:[^"\\]|\\.)*"(?=\s*:)/y],
    ["string", /"(?:[^"\\]|\\.)*"/y],
    ["literal", /\b(?:true|false|null)\b/y],
    NUMBER,
    ["comment", /\/\/[^\n]*/y],
    IDENT,
    PUNCT,
  ],
  bash: [
    WS,
    ["comment", /#[^\n]*/y],
    ["string", /"(?:[^"\\]|\\.)*"|'[^']*'/y],
    ["keyword", /(?<![\w-])--?[A-Za-z][\w-]*/y],
    ["func", /(?<=^|\n|\|\s?|&&\s?)[A-Za-z_][\w.-]*/y],
    NUMBER,
    ["plain", /[\w./:@-]+/y],
    PUNCT,
  ],
  ts: [
    WS,
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
    ["string", /`(?:[^`\\]|\\.)*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y],
    ["literal", /\b(?:true|false|null|undefined)\b/y],
    [
      "keyword",
      /\b(?:const|let|var|function|return|if|else|for|of|in|while|import|from|export|default|class|new|await|async|type|interface|extends|implements|throw|try|catch)\b/y,
    ],
    NUMBER,
    ["func", /[A-Za-z_$][\w$]*(?=\()/y],
    ["key", /[A-Za-z_$][\w$]*(?=\s*:)/y],
    IDENT,
    PUNCT,
  ],
};

export function tokenize(code: string, lang: Lang): Token[] {
  if (lang === "text") return [{ type: "plain", text: code }];
  const rules = RULES[lang];
  const out: Token[] = [];
  let pos = 0;
  while (pos < code.length) {
    let matched = false;
    for (const [type, re] of rules) {
      re.lastIndex = pos;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        const last = out[out.length - 1];
        if (last && last.type === type) last.text += m[0];
        else out.push({ type, text: m[0] });
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Unreachable with the catch-all rules above, but never loop forever on odd input.
      out.push({ type: "plain", text: code[pos] });
      pos += 1;
    }
  }
  return out;
}
