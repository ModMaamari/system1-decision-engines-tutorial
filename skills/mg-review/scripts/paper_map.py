#!/usr/bin/env python3
"""Map a paper into anchors for review notes, and cross-reference its numbers.

Usage:
    python paper_map.py paper.tex              # outline: sections, paragraphs, captions, line ranges
    python paper_map.py paper.pdf --numbers    # claim numbers vs evidence, and internal pointers
    python paper_map.py paper.md --json        # machine-readable outline

Anchors look like S3.2.P4 (section 3.2, paragraph 4), S0.P1 (abstract) and
SA.P2 (appendix A). Captions are S3.2.Cap1. Line ranges refer to the source
file (for LaTeX projects, the file that holds the line). For PDF input, line
numbers refer to the extracted text, and page numbers are shown.

Supports .tex (follows \\input and \\include), .md, .txt and .pdf. PDF needs
the pdftotext command or the pypdf package. Uses the standard library only.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

# --------------------------------------------------------------------------
# Loading. Each loaded line is (text, origin_file, origin_line, page).
# --------------------------------------------------------------------------


def load_tex(path, seen=None):
    seen = seen if seen is not None else set()
    path = path.resolve()
    if path in seen or not path.exists():
        return []
    seen.add(path)
    out = []
    for i, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
        body = re.sub(r"(?<!\\)%.*", "", line)
        m = re.search(r"\\(input|include)\{([^}]+)\}", body)
        if m:
            target = Path(m.group(2))
            if target.suffix != ".tex":
                target = target.with_suffix(".tex")
            sub = (path.parent / target)
            if not sub.exists():
                sub = (Path.cwd() / target)
            out.append((body[:m.start()], path, i, None))
            out.extend(load_tex(sub, seen))
            out.append((body[m.end():], path, i, None))
            continue
        out.append((body, path, i, None))
    return out


def load_pdf(path):
    text = None
    if shutil.which("pdftotext"):
        r = subprocess.run(["pdftotext", str(path), "-"], capture_output=True, text=True)
        if r.returncode == 0:
            text = r.stdout
    if text is None:
        try:
            import pypdf  # noqa: PLC0415
            text = "\f".join(p.extract_text() or "" for p in pypdf.PdfReader(str(path)).pages)
        except ImportError:
            sys.exit("PDF input needs the pdftotext command (poppler-utils) or `pip install pypdf`. "
                     "Alternatively, convert the PDF to text and pass the .txt file.")
    out, page = [], 1
    for i, line in enumerate(text.split("\n"), 1):
        page += line.count("\f")
        out.append((line.replace("\f", ""), path, i, page))
    return out


def load_plain(path):
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    return [(line, path, i, None) for i, line in enumerate(lines, 1)]


# --------------------------------------------------------------------------
# Section detection
# --------------------------------------------------------------------------

TEX_LEVELS = {"part": 0, "section": 1, "subsection": 2, "subsubsection": 3}
FLOAT_ENVS = r"figure\*?|table\*?|teaserfigure|wrapfigure|wraptable|algorithm\*?|listing|longtable|tikzpicture"
SKIP_ENVS = r"thebibliography"


def detect_heading(text, kind, state):
    """Return (level, number_or_None, title) if the line is a heading."""
    s = text.strip()
    if kind == "tex":
        if re.search(r"\\begin\{abstract\}", s):
            return (1, "0", "Abstract")
        if re.search(r"\\appendix\b", s):
            state["appendix"] = True
            return None
        m = re.search(r"\\(section|subsection|subsubsection)(\*?)\s*(\[[^\]]*\])?\{(.+?)\}\s*(\\label\{[^}]*\})?\s*$", s)
        if m:
            title = re.sub(r"\\[A-Za-z]+\*?(\{([^}]*)\})?", lambda x: x.group(2) or "", m.group(4)).strip()
            return (TEX_LEVELS[m.group(1)], None if not m.group(2) else "*", title)
        return None
    if kind == "md":
        m = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", s)
        if m:
            return (len(m.group(1)), None, m.group(2).strip())
        return None
    # txt and pdf: heuristics for numbered headings and common unnumbered ones
    if not s or len(s) > 90 or s.endswith((".", ",", ";", ":")):
        return None
    if re.fullmatch(r"(?i)abstract", s):
        return (1, "0", "Abstract")
    if re.fullmatch(r"(?i)(references|bibliography|acknowledge?ments?|appendix|appendices|supplementary material)", s):
        if s.lower().startswith("append") or s.lower().startswith("suppl"):
            state["appendix"] = True
        return (1, "*", s)
    m = re.fullmatch(r"(\d{1,2}(?:\.\d{1,2}){0,2})\.?\s+([A-Z][A-Za-z][^\n]{1,80})", s)
    if m and len(re.findall(r"[A-Za-z]", m.group(2))) >= 4 and not re.search(r"\d\s+\d", m.group(2)):
        num = m.group(1)
        state["numbered"] = True
        return (num.count(".") + 1, num, m.group(2).strip())
    m = re.fullmatch(r"([A-H](?:\.\d{1,2}){0,2})\.?\s+([A-Z][A-Za-z][^\n]{1,80})", s)
    title_case = m and all(w[0].isupper() or w.lower() in ("and", "of", "the", "for", "in", "on", "with", "a", "to")
                           for w in m.group(2).split())
    if m and (state.get("appendix") or (state.get("numbered") and title_case)):
        state["appendix"] = True
        num = m.group(1)
        return (num.count(".") + 1, num, m.group(2).strip())
    return None


class Numberer:
    def __init__(self):
        self.counts = [0, 0, 0, 0]
        self.appendix = False

    def next(self, level, explicit, appendix):
        if explicit not in (None, "*"):
            return explicit
        if explicit == "*":
            return None
        if appendix and not self.appendix:
            self.appendix = True
            self.counts = [0, 0, 0, 0]
        level = max(1, min(level, 3))
        self.counts[level] += 1
        for j in range(level + 1, 4):
            self.counts[j] = 0
        parts = self.counts[1:level + 1]
        if self.appendix:
            head = chr(ord("A") + parts[0] - 1)
            return ".".join([head] + [str(p) for p in parts[1:]])
        return ".".join(str(p) for p in parts)


# --------------------------------------------------------------------------
# Building the map
# --------------------------------------------------------------------------


def words(s):
    return re.findall(r"[A-Za-z][A-Za-z'\-]*", s)


def clean_tex(s):
    s = re.sub(r"\\(cite[tp]?|ref|eqref|label|autoref|cref)\*?(\[[^\]]*\])*\{[^}]*\}", "[ref]", s)
    s = re.sub(r"\\[A-Za-z]+\*?", " ", s)
    s = re.sub(r"[{}$~\\]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def build(lines, kind):
    md_title_skipped = False
    if kind == "md":
        h1 = [i for i, (t, *_ ) in enumerate(lines) if re.match(r"^#\s", t)]
        md_title_skipped = len(h1) == 1
    state = {"appendix": False}
    numberer = Numberer()
    sections = []
    cur = {"id": "Front", "title": "(before first heading)", "level": 1, "paras": [], "captions": [],
           "start": 0}
    sections.append(cur)
    line_anchor = [None] * len(lines)
    in_doc = kind != "tex"
    float_depth = 0
    skip_depth = 0
    block = []

    def flush():
        nonlocal block
        if not block:
            return
        text = " ".join(lines[i][0] for i in block)
        prose = clean_tex(text) if kind == "tex" else text
        if len(words(prose)) >= 5:
            n = len(cur["paras"]) + 1
            pid = f"{cur['id']}.P{n}" if cur["id"] != "Front" else f"Front.P{n}"
            cur["paras"].append({"id": pid, "lines": (block[0], block[-1]), "words": len(words(prose)),
                                 "start": " ".join(prose.split()[:14])})
            for i in block:
                line_anchor[i] = pid
        block = []

    for i, (text, _f, _ln, _pg) in enumerate(lines):
        if kind == "tex":
            if not in_doc:
                line_anchor[i] = "skip"
                if r"\begin{document}" in text:
                    in_doc = True
                continue
            if r"\end{document}" in text:
                flush()
                break
            if re.search(r"\\begin\{(" + SKIP_ENVS + r")\}", text):
                skip_depth += 1
            if skip_depth:
                line_anchor[i] = "skip"
                if re.search(r"\\end\{(" + SKIP_ENVS + r")\}", text):
                    skip_depth -= 1
                continue
            if re.search(r"\\begin\{(" + FLOAT_ENVS + r")\}", text):
                flush()
                float_depth += 1
            if float_depth:
                line_anchor[i] = f"{cur['id']}.Float"
                m = re.search(r"\\caption(\[[^\]]*\])?\{(.*)", text)
                if m:
                    n = len(cur["captions"]) + 1
                    cid = f"{cur['id']}.Cap{n}"
                    cur["captions"].append({"id": cid, "lines": (i, i), "start": " ".join(clean_tex(m.group(2)).split()[:14])})
                    line_anchor[i] = cid
                if re.search(r"\\end\{(" + FLOAT_ENVS + r")\}", text):
                    float_depth -= 1
                continue
            if re.search(r"\\end\{abstract\}", text):
                flush()
                continue
        h = detect_heading(text, kind, state)
        if kind == "md" and h and h[0] == 1 and md_title_skipped and not sections[0]["paras"] and len(sections) == 1:
            sections[0]["title"] = h[2]
            sections[0]["id"] = "Title"
            md_title_skipped = False
            continue
        if h:
            flush()
            level, explicit, title = h
            if kind == "md" and md_title_skipped is False and any(s["id"] == "Title" for s in sections):
                level = max(1, level - 1)
            if title.lower() == "abstract":
                sid = "0"
            else:
                sid = numberer.next(level, explicit, state["appendix"])
            if sid is None:
                sid = re.sub(r"[^A-Za-z]", "", title)[:3].capitalize() or "X"
            cur = {"id": f"S{sid}", "title": title, "level": level, "paras": [], "captions": [], "start": i}
            sections.append(cur)
            line_anchor[i] = cur["id"]
            continue
        if not text.strip():
            flush()
        else:
            block.append(i)
        if kind != "tex":
            m = re.match(r"^\s*((Figure|Fig\.|Table)\s+\d+[.:])", text)
            if m:
                flush()
                n = len(cur["captions"]) + 1
                cid = f"{cur['id']}.Cap{n}"
                cur["captions"].append({"id": cid, "lines": (i, i), "start": " ".join(text.split()[:14])})
                line_anchor[i] = cid
    flush()
    # Fill anchors for unassigned lines with the enclosing section.
    sec_starts = [(s["start"], s["id"]) for s in sections]
    for i in range(len(lines)):
        if line_anchor[i] is None:
            sid = "Front"
            for st, s_id in sec_starts:
                if st <= i:
                    sid = s_id
            line_anchor[i] = sid
    sections = [s for s in sections if s["paras"] or s["captions"] or s["id"] != "Front"]
    return sections, line_anchor


def loc(lines, a, b=None):
    f, la, pa = lines[a][1], lines[a][2], lines[a][3]
    lb = lines[b][2] if b is not None else la
    rng = f"L{la}" if la == lb else f"L{la}–{lb}"
    page = f" p.{pa}" if pa else ""
    return f"{f.name}:{rng}{page}"


# --------------------------------------------------------------------------
# Numbers
# --------------------------------------------------------------------------

NUM = re.compile(
    r"(?<![\w.\\])(?P<val>[-−]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-−]?\d+(?:\.\d+)?)"
    r"(?P<unit>\s?(?:\\?%|×|x(?![A-Za-z])|\\times|k(?![A-Za-z])|M(?![A-Za-z])|B(?![A-Za-z])|ms|s(?![A-Za-z])|GB|MB|TB|h(?![A-Za-z])|pp))?"
)
REF_BEFORE = re.compile(r"(Table|Tab\.|Figure|Fig\.|Section|Sec\.|§|Eq\.|Equation|Appendix|Algorithm|Line|line|Theorem|Lemma|RQ|Step|Chapter|row|Row)\s*~?$")
EVIDENCE_SECTIONS = re.compile(r"(?i)experiment|result|evaluat|ablation|analys|benchmark|appendix|supplement")


def norm(val):
    v = val.replace(",", "").replace("−", "-")
    try:
        return float(v)
    except ValueError:
        return None


def extract_numbers(lines, kind):
    out = []
    for i, (text, *_rest) in enumerate(lines):
        t = text
        if kind == "tex":
            t = re.sub(r"\\(cite[tp]?|ref|eqref|label|autoref|cref|url|href|includegraphics|usepackage|documentclass)\*?(\[[^\]]*\])*\{[^}]*\}", " ", t)
        for m in NUM.finditer(t):
            val = m.group("val")
            if REF_BEFORE.search(t[:m.start()]):
                continue
            f = norm(val)
            if f is None:
                continue
            if re.fullmatch(r"(19|20)\d\d", val) and not m.group("unit"):
                continue  # years, mostly citations
            if "." not in val and not m.group("unit") and abs(f) < 2:
                continue  # 0 and 1 are too common to cross-reference
            ctx = re.sub(r"\s+", " ", t[max(0, m.start() - 45):m.end() + 45]).strip()
            out.append({"line": i, "val": val, "f": f, "unit": unit_of(m.group("unit")), "ctx": ctx})
    return out


def unit_of(raw):
    u = (raw or "").strip()
    return {"\\%": "%", "x": "×", "\\times": "×"}.get(u, u)


def same_value(a, b):
    """True when b equals a, or rounds to a at a's precision, with compatible units."""
    if a["unit"] != b["unit"] and a["unit"] and b["unit"]:
        return False
    if a["unit"] in ("k", "M", "B", "%") or b["unit"] in ("k", "M", "B", "%"):
        if a["unit"] != b["unit"]:
            return False
    if a["f"] == b["f"]:
        return True
    dec = len(a["val"].split(".")[1]) if "." in a["val"] else 0
    if dec == 0 and "." not in b["val"]:
        return False
    return round(b["f"], dec) == a["f"]


# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------


def render_outline(path, lines, sections):
    out = [f"# Paper map: {path.name}", ""]
    out.append("Anchors: S<section>.P<paragraph> for paragraphs, S<section>.Cap<n> for figure and table captions.")
    out.append("Cite them in review notes together with the line range.")
    out.append("")
    for s in sections:
        total = sum(p["words"] for p in s["paras"])
        indent = "  " * (max(1, s["level"]) - 1)
        out.append(f"{indent}{s['id']}  {s['title']}  ({len(s['paras'])} paragraphs, {total} words)")
        for p in s["paras"]:
            out.append(f"{indent}  {p['id']:<12} {loc(lines, *p['lines']):<26} {p['words']:>4}w  \"{p['start']} ...\"")
        for c in s["captions"]:
            out.append(f"{indent}  {c['id']:<12} {loc(lines, *c['lines']):<26}  caption \"{c['start']} ...\"")
    abstract = [s for s in sections if s["id"] == "S0"]
    if abstract:
        w = sum(p["words"] for p in abstract[0]["paras"])
        out.append("")
        out.append(f"Abstract length: about {w} words (MG's editorial target is 180 to 220; venue limits take precedence).")
    return "\n".join(out)


def render_numbers(path, lines, sections, anchors, nums):
    titles = {s["id"]: s["title"] for s in sections}
    nums = [n for n in nums if anchors[n["line"]] != "skip"]

    def section_of(anchor):
        sid = anchor.split(".P")[0].split(".Cap")[0].split(".Float")[0]
        return sid

    def is_evidence(n):
        a = n["anchor"]
        return (".Float" in a or ".Cap" in a or EVIDENCE_SECTIONS.search(titles.get(n["sec"], ""))
                or re.match(r"S[A-H](\.|$)", n["sec"]) is not None)

    head, rest = [], []
    for n in nums:
        n["anchor"] = anchors[n["line"]]
        n["sec"] = section_of(n["anchor"])
        (rest if is_evidence(n) else head).append(n)

    out = [f"# Number and pointer cross-reference: {path.name}", ""]
    out.append("Claim numbers are numbers stated outside the evidence (abstract, introduction, background, method,")
    out.append("discussion, conclusion). Evidence is the experiments, results and appendix sections plus every")
    out.append("table, figure and caption. For each claim number, the list shows where the same value (or a value")
    out.append("that rounds to it) appears in the evidence. A claim number with no match may be stale, computed in")
    out.append("the text, a setting, or from a different run: verify it by hand. Matching values can still belong")
    out.append("to different configurations, so check the context.")
    out.append("")
    missing, found = [], []
    for h in head:
        matches = [r for r in rest if same_value(h, r)]
        entry = f"- {h['val']}{h['unit']}  at {h['anchor']} {loc(lines, h['line'])}: \"{h['ctx']}\""
        if matches:
            where = "; ".join(f"{m['anchor']} {loc(lines, m['line'])} (\"{m['ctx'][:70]}\")" for m in matches[:4])
            more = f" and {len(matches) - 4} more" if len(matches) > 4 else ""
            found.append(entry + f"\n    also at: {where}{more}")
        else:
            missing.append(entry)
    out.append(f"## Claim numbers with no match in the evidence ({len(missing)})")
    out.append("")
    out.extend(missing or ["(none)"])
    out.append("")
    out.append(f"## Claim numbers found in the evidence ({len(found)})")
    out.append("")
    out.extend(found or ["(none)"])

    # Same unit-bearing quantity stated with different values in nearby wording is out of scope;
    # list repeated values across many sections, which often signal a shared budget or setting.
    by_val = defaultdict(set)
    for n in nums:
        if n["unit"] or "." in n["val"]:
            by_val[(n["val"], n["unit"])].add(n["sec"])
    shared = sorted(((k, v) for k, v in by_val.items() if len(v) >= 3), key=lambda kv: -len(kv[1]))
    if shared:
        out.append("")
        out.append("## Values repeated across three or more sections (check they refer to the same setting)")
        out.append("")
        for (val, unit), secs in shared[:25]:
            out.append(f"- {val}{unit}: {', '.join(sorted(secs))}")
    out.extend(render_pointers(lines, sections, anchors))
    return "\n".join(out)


def render_pointers(lines, sections, anchors):
    """List internal pointers (Section N, \\ref) with their targets, so forward
    references and wrong targets can be checked."""
    order = [s["id"] for s in sections]
    titles = {s["id"]: s["title"] for s in sections}
    labels = {}
    for i, (text, *_r) in enumerate(lines):
        for m in re.finditer(r"\\label\{([^}]+)\}", text):
            labels[m.group(1)] = anchors[i]
    found = []
    for i, (text, *_r) in enumerate(lines):
        src = anchors[i]
        if src == "skip":
            continue
        src_sec = src.split(".P")[0].split(".Cap")[0].split(".Float")[0]
        for m in re.finditer(r"\b(Section|Sec\.|§)\s*~?(\d+(?:\.\d+)*|[A-H](?:\.\d+)*)\b", text):
            found.append((i, src, src_sec, m.group(0), "S" + m.group(2)))
        for m in re.finditer(r"\\(?:auto|c|C)?ref\{([^}]+)\}", text):
            found.append((i, src, src_sec, m.group(0), labels.get(m.group(1))))
    if not found:
        return []
    res = ["", "## Internal pointers (check that the target exists, says what the text claims, and is not a forward reference the reader needs)", ""]
    for i, src, src_sec, txt, tgt in found:
        tsec = tgt.split(".P")[0].split(".Cap")[0].split(".Float")[0] if tgt else None
        if tgt is None:
            note = "target label not found"
        elif tsec not in titles:
            note = "target section does not exist"
        else:
            note = f"-> {tgt} ({titles[tsec]})"
            if src_sec in order and tsec in order and order.index(tsec) > order.index(src_sec):
                note += ", forward reference"
        res.append(f"- {src} {loc(lines, i)}: \"{txt}\" {note}")
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paper", help="paper file: .tex (main file), .md, .txt or .pdf")
    ap.add_argument("--numbers", action="store_true",
                    help="cross-reference claim numbers against the evidence, and list internal pointers")
    ap.add_argument("--json", action="store_true", help="print the outline as JSON")
    args = ap.parse_args()

    path = Path(args.paper)
    if not path.exists():
        sys.exit(f"Not found: {path}")
    suffix = path.suffix.lower()
    if suffix == ".tex":
        kind, lines = "tex", load_tex(path)
        if not any(r"\begin{document}" in t for t, *_ in lines):
            # A section file without a preamble: treat the whole file as the document.
            lines = [(r"\begin{document}", path, 0, None)] + lines
    elif suffix == ".pdf":
        kind, lines = "pdf", load_pdf(path)
    elif suffix in (".md", ".markdown"):
        kind, lines = "md", load_plain(path)
    else:
        kind, lines = "txt", load_plain(path)

    sections, anchors = build(lines, kind)
    if args.json:
        data = [{
            "id": s["id"], "title": s["title"],
            "paragraphs": [{"id": p["id"], "loc": loc(lines, *p["lines"]), "words": p["words"], "start": p["start"]}
                           for p in s["paras"]],
            "captions": [{"id": c["id"], "loc": loc(lines, *c["lines"]), "start": c["start"]} for c in s["captions"]],
        } for s in sections]
        print(json.dumps(data, indent=2, ensure_ascii=False))
    elif args.numbers:
        print(render_numbers(path, lines, sections, anchors, extract_numbers(lines, kind)))
    else:
        print(render_outline(path, lines, sections))


if __name__ == "__main__":
    main()
