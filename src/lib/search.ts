import { CHAPTERS, PARTS } from "../content/chapters";
import { GLOSSARY } from "../content/glossary";

export interface SearchItem {
  kind: "chapter" | "term";
  title: string;
  detail: string;
  chapter: string;
}

export const SEARCH_INDEX: SearchItem[] = [
  ...CHAPTERS.map((c, i) => ({
    kind: "chapter" as const,
    title: `${i + 1}. ${c.title}`,
    detail: `${PARTS.find((p) => p.id === c.part)?.title ?? ""} · ${c.summary}`,
    chapter: c.id,
  })),
  ...GLOSSARY.map((t) => ({ kind: "term" as const, title: t.term, detail: t.def, chapter: t.chapter })),
];

/**
 * Every word of the query must appear somewhere in the item. Matches in the title rank above
 * matches in the detail, and a title that starts with the query ranks first.
 */
export function search(query: string, items: SearchItem[] = SEARCH_INDEX, limit = 12): SearchItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items.filter((i) => i.kind === "chapter").slice(0, limit);
  const scored: { item: SearchItem; score: number }[] = [];
  for (const item of items) {
    const title = item.title.toLowerCase().replace(/^\d+\.\s*/, "");
    const detail = item.detail.toLowerCase();
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (title.includes(w)) score += title.startsWith(w) ? 6 : 4;
      else if (detail.includes(w)) score += 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push({ item, score: score + (item.kind === "chapter" ? 0.5 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.item);
}
