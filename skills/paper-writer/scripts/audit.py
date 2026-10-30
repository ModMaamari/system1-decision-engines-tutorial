#!/usr/bin/env python3
"""Flag candidate AI-associated patterns in academic and technical prose.

Usage:
    python audit.py draft.tex [more files ...]
    python audit.py --json draft.md
    cat section.txt | python audit.py -

Every hit is a candidate for the necessity test in SKILL.md, not an error.
Math, code, citation keys, quotations and the bibliography are masked before
scanning, and common technical collocations ("statistically significant",
"loss landscape", "robust standard errors", ranges like 2019--2023) are
suppressed. Uses the standard library only.
"""

import argparse
import json
import re
import statistics
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Masking: replace regions with spaces while keeping newlines, so line
# numbers in the report still match the source.
# --------------------------------------------------------------------------


def _blank(m):
    return re.sub(r"[^\n]", " ", m.group(0))


def _mask(text, pattern, flags=0):
    return re.sub(pattern, _blank, text, flags=flags)


def _mask_group(text, pattern, group, flags=0):
    """Blank only one capture group of each match."""

    def repl(m):
        s, e = m.span(group)
        whole = m.group(0)
        off = m.start(0)
        inner = re.sub(r"[^\n]", " ", whole[s - off:e - off])
        return whole[: s - off] + inner + whole[e - off:]

    return re.sub(pattern, repl, text, flags=flags)


LATEX_ENVS = (
    r"equation\*?|align\*?|gather\*?|multline\*?|eqnarray\*?|displaymath|math|"
    r"verbatim|lstlisting|minted|algorithmic|algorithm\*?|tabular\*?|tabularx|"
    r"thebibliography|comment"
)


def mask_text(text, is_tex):
    if is_tex:
        # Comments: an unescaped % to end of line.
        text = _mask(text, r"(?<!\\)%[^\n]*")
        text = _mask(text, r"\\begin\{(" + LATEX_ENVS + r")\}.*?\\end\{\1\}", re.S)
        # Bibliography commands and everything after an appendix-free bib.
        text = _mask(text, r"\\bibliography\{[^}]*\}|\\printbibliography")
        # Arguments of reference-like commands.
        text = _mask_group(
            text,
            r"\\(?:cite[tp]?\*?|citeauthor|citeyear|ref|eqref|autoref|cref|Cref|"
            r"label|url|href|includegraphics|input|include|usepackage|"
            r"documentclass|bibliographystyle)(\[[^\]]*\])*\{([^}]*)\}",
            2,
        )
        # Display and inline math.
        text = _mask(text, r"\$\$.*?\$\$", re.S)
        text = _mask(text, r"\\\[.*?\\\]", re.S)
        text = _mask(text, r"\\\(.*?\\\)", re.S)
        text = _mask(text, r"(?<!\\)\$[^$\n]+?(?<!\\)\$")
        # LaTeX quotes ``...''
        text = _mask(text, r"``[^\n]{0,400}?''")
    else:
        text = _mask(text, r"```.*?```", re.S)
        text = _mask(text, r"~~~.*?~~~", re.S)
        text = _mask(text, r"`[^`\n]+`")
        text = _mask(text, r"\$\$.*?\$\$", re.S)
        text = _mask(text, r"(?<!\\)\$[^$\n]+?(?<!\\)\$")
        # Markdown link targets and bare URLs.
        text = _mask_group(text, r"\]\(([^)]*)\)", 1)
        text = _mask(text, r"https?://\S+")
        # Blockquotes are usually quotations.
        text = _mask(text, r"(?m)^\s*>[^\n]*")
    # Quoted material (straight and curly double quotes), within one paragraph.
    text = _mask(text, r"\"[^\"\n]{1,400}\"")
    text = _mask(text, r"\u201c[^\u201d]{1,400}?\u201d")
    # Bibliography/References section to the end of the file.
    m = re.search(
        r"(?im)^(\s*#{1,6}\s*(references|bibliography|works cited)\s*$|"
        r"\s*\\section\*?\{(references|bibliography)\}|"
        r"\s*(references|bibliography)\s*$)",
        text,
    )
    if m:
        text = text[: m.start()] + re.sub(r"[^\n]", " ", text[m.start():])
    return text


# --------------------------------------------------------------------------
# Patterns. Each word entry: regex, tier, and "keep" regexes that mark the
# technical senses listed in references/keep-list.md. The keep regex is
# tested against the sentence that contains the hit.
# --------------------------------------------------------------------------

P_VALUE = r"\bp\s*[<=>≤]|\bp-value|statistic|\bα\b|alpha\s*=|confidence interval|\bCI\b|t\(\d|F\(\d|χ|chi-square"

WORDS = [
    # tier "high": ornamental in nearly every use
    (r"\bdelv(e|es|ed|ing)\b", "high", []),
    (r"\btapestr(y|ies)\b", "high", []),
    (r"\btestament\b", "high", []),
    (r"\bunderscor(e|es|ed|ing)\b", "high", []),
    (r"\bshowcas(e|es|ed|ing)\b", "high", []),
    (r"\bpivotal\b", "high", []),
    (r"\bintricat(e|ely|acies|acy)\b", "high", []),
    (r"\binterplay\b", "high", []),
    (r"\bmeticulous(ly)?\b", "high", []),
    (r"\bboast(s|ed|ing)?\b", "high", []),
    (r"\bbolster(s|ed|ing)?\b", "high", []),
    (r"\bgarner(s|ed|ing)?\b", "high", []),
    (r"\bvibrant\b", "high", []),
    (r"\bgroundbreaking\b", "high", []),
    (r"\brealm\b", "high", []),
    (r"\bcrucial(ly)?\b", "high", []),
    (r"\bseamless(ly)?\b", "high", []),
    (r"\bcommendable\b", "high", []),
    (r"\bnoteworthy\b", "high", []),
    (r"\bfoster(s|ed|ing)?\b", "high", [r"\bfoster (care|parent|child|famil|home)"]),
    (r"\blandscape\b", "high",
     [r"\b(loss|energy|fitness|optimi[sz]ation|error|free[- ]energy|potential[- ]energy|adaptive|rugged)\s+landscapes?",
      r"landscape (ecology|architecture|scale|genetics)"]),
    (r"\bhighlight(s|ed|ing)?\b", "high",
     [r"highlighted (in|with) (bold|red|blue|green|gr[ae]y|yellow|colou?r)", r"\bhighlight(ed|s)? (row|cell|column)"]),
    (r"\benhanc(e|es|ed|ing)\b", "high",
     [r"contrast[- ]enhanc", r"\b(image|signal|speech|contrast) enhanc"]),
    (r"\bvaluable\b", "high", []),
    (r"\bnuanced\b", "high", []),
    (r"\btransformative\b", "high", []),
    # tier "editorial": often ornamental, often technical
    (r"\bleverag(e|es|ed|ing)\b", "editorial", [r"\b(financial|operating) leverage\b", r"\bleverage (ratio|point|score)"]),
    (r"\brobust(ly|ness)?\b", "editorial",
     [r"robust (standard error|regression|statisti|optimi[sz]ation|control|estimat|covariance|loss|PCA|principal)",
      r"robust(ness)? to\b", r"\bRoBERTa\b", r"(adversarial|certified|distributional(ly)?) robust"]),
    (r"\bmultifaceted\b", "editorial", []),
    (r"\bholistic(ally)?\b", "editorial", []),
    (r"\bnavigat(e|es|ed|ing)\b", "editorial", [r"\b(robot|agent|vehicle|drone|rover|user|participant)s?\b.*navigat"]),
    (r"\becosystems?\b", "editorial", [r"\b(marine|forest|aquatic|terrestrial|freshwater|soil|microbial|coastal) ecosystem"]),
    (r"\bunlock(s|ed|ing)?\b", "editorial", [r"\b(mutex|lock)\b"]),
    (r"\bempower(s|ed|ing|ment)?\b", "editorial", []),
    (r"\belevat(e|es|ing)\b", "editorial", [r"elevat\w* (level|blood|pressure|temperature|risk|expression|serum)"]),
    (r"\bever-evolving\b", "editorial", []),
    (r"\bcutting[- ]edge\b", "editorial", []),
    (r"\bgame[- ]chang(ing|er)\b", "editorial", []),
    (r"\bimpactful\b", "editorial", []),
    (r"\bprofound(ly)?\b", "editorial", [r"profound(ly)? (deaf|hearing loss|hypotension|hypoxia)"]),
    (r"\brevolutionary\b", "editorial", [r"\b(American|French|Russian|Haitian) Revolution"]),
    (r"\binnovative\b", "editorial", []),
    (r"\bnovel\b", "editorial", [r"novel (coronavirus|object recognition|object|class(es)?|categor|word)", r"\b(a|the|his|her|their) novel\b(?! (method|approach|framework|technique|architecture|model|algorithm))"]),
    (r"\bremarkabl(e|y)\b", "editorial", []),
    (r"\bcomprehensive(ly)?\b", "editorial", [r"comprehensive (exam|metabolic panel|school|cancer cent)"]),
    (r"\bparadigm\b", "editorial", [r"(programming|experimental|oddball|task|go/no-go|stop-signal|testing) paradigm", r"paradigm (task|in which)"]),
    (r"\bsynerg(y|ies|istic)\b", "editorial", [r"synergistic (effect|interaction|drug|combination)"]),
    (r"\butili[sz](e|es|ed|ing|ation)\b", "editorial", [r"(capacity|CPU|GPU|bandwidth|resource|memory|server|bed|healthcare) utili[sz]ation"]),
    (r"\bharness(es|ed|ing)?\b", "editorial", [r"\b(test|safety|wiring|evaluation) harness"]),
    (r"\bshed(s|ding)? light\b", "editorial", []),
    (r"\bpave[sd]? the way\b", "editorial", []),
    (r"\bpivot(s|ed)?\b", "editorial", [r"pivot(ing)? (element|row|column|table|point)", r"partial pivoting"]),
    (r"\bsignificant(ly)?\b", "editorial",
     [P_VALUE, r"statistically significant", r"significant (at|figures|digits|level)", r"significance",
      r"\d+(\.\d+)?\s*(%|points?|pp|BLEU|F1|dB|ms|x\b|×)"]),
    (r"\bcritical(ly)?\b", "editorial",
     [r"critical (value|point|temperature|exponent|path|section|region|mass|care|race|theory|period|phenomena|current|angle|density|threshold|infrastructure|illness|limb)",
      r"critically ill"]),
    (r"\bessential(ly)?\b", "editorial",
     [r"essential (singularity|supremum|spectrum|hypertension|tremor|amino|gene|fatty|oil|nutrient|range)",
      r"essentially (bounded|self-adjoint|unique)"]),
    (r"\bfundamental(ly)?\b", "editorial",
     [r"fundamental (theorem|frequency|group|solution|domain|mode|constant|analysis|interaction|force|particle|matrix|limit|unit|law|class|diagram|lemma|representation)"]),
    (r"\bdynamic\b", "editorial",
     [r"dynamic (programming|range|system|equilibrium|memory|allocation|typing|time warping|graph|pricing|model|programming|stability|viscosity|light scattering|causal|treatment regime|mode decomposition|link)"]),
    (r"\bpotential(ly)?\b", "editorial",
     [r"potential (energy|function|field|difference|game|well|flow|outcome|barrier|surface)",
      r"(electric(al)?|chemical|membrane|action|evoked|zeta|redox|electrostatic|gravitational|Coulomb|Lennard|scalar|vector) potential",
      r"potential outcomes"]),
    (r"\bkey\b", "editorial",
     [r"(primary|foreign|public|private|secret|encryption|decryption|API|session|composite|candidate|sort|hash|attention) keys?",
      r"key[- ](value|frame|point|stroke|board|word|query|press|space|ring|pair|exchange|signature)",
      r"\bquer(y|ies),? keys?\b", r"keys? and values?", r"\bkeys? (matrix|vector|dimension)", r"in the key of"]),
    (r"\bperfect(ly)?\b", "editorial",
     [r"perfect(ly)? (competition|competitive|information|matching|square|fluid|conductor|elastic|recall|separab|correlat|aligned|collinear|multicollinear|secrecy|fifth|number|code|hash)",
      r"perfect (accuracy|score) (of|on)"]),
    (r"\balign(s|ed)? with\b", "editorial", []),
    (r"\bexplor(e|es|ed|ing)\b", "editorial", [r"\bexplor(e|ing) (the )?(state|action|environment|search) space", r"exploratory"]),
    (r"\baddress(es|ed|ing)? (the|this|these|a|an|our|its|their)\b", "editorial",
     [r"(memory|IP|MAC|email|web|virtual|physical|base|return|home|street) address", r"\b(reviewer|comment|R\d)"]),
    (r"\b(our|the proposed|this) (novel )?(method|framework|approach)\b", "editorial", []),
    (r"\binsights?\b", "editorial", [r"insight problem", r"insight (into|that)\b.*\b(show|find|measur)", r"\bInsight\b"]),
    (r"\bplays? an? (crucial|pivotal|key|vital|important|critical|central|significant|essential|major) role\b", "editorial", []),
]

# Density-only words: report per-1000-word rate, never individual lines.
DENSITY_WORDS = [
    "across", "within", "findings", "insights", "notably", "particularly",
    "potential", "comprehensive", "exhibited", "primarily", "thoroughly",
    "effectively", "advancements", "additionally",
]

TEMPLATES = [
    (r"\bnot (just|only|merely|simply)\b[^.?!]{0,120}\bbut( also)?\b", "not-only/just X but Y frame"),
    (r"\b(it|this) (is|was)n['’]?t\b[^.?!]{0,80}[;,.]\s*(it|this)['’]?s?\b", "it's-not-X-it's-Y antithesis"),
    (r"\b(it is|it's) (important|worth|crucial|essential|critical|interesting) to (note|noting|recogni[sz]e|understand|mention|emphasi[sz]e)\b", "throat-clearing"),
    (r"\bit (is|was) worth noting\b", "throat-clearing"),
    (r"\bit should be noted\b", "throat-clearing"),
    (r"\bneedless to say\b", "throat-clearing"),
    (r"\b(stands|serves) as an?\b", "inflated 'serves as' (prefer 'is')"),
    (r"\b(marks?|marked) an? (significant|pivotal|turning|major|key) (point|moment|milestone|shift)\b", "significance inflation"),
    (r"\b(far-reaching|wide-ranging) implications\b", "significance inflation"),
    (r"\bparadigm shift\b", "significance inflation"),
    (r"\b(in )?today['’]s (rapidly|fast|ever|increasingly)\b", "panorama opening"),
    (r"\b(rapidly|ever)[- ](evolving|changing) (landscape|world|field)\b", "panorama opening"),
    (r"\bin (an|the) (era|age) of\b", "panorama opening"),
    (r"\bin recent years\b[^.]{0,80}\b(attention|interest|traction)\b", "panorama opening"),
    (r"\bin conclusion\b|\bto conclude\b|\bin summary\b|\bto sum up\b", "canned conclusion"),
    (r"\bdespite (these|the) challenges\b", "challenges boilerplate"),
    (r"\b(the )?future (looks|is) (bright|promising)\b", "canned conclusion"),
    (r"\bopens? (up )?(new|exciting) avenues\b", "canned conclusion"),
    (r"\bat (its|the) (core|heart)\b", "canned framing"),
    (r"\bwhen it comes to\b", "canned framing"),
    (r"\ba (wide|broad) (range|variety|array|spectrum) of\b|\ba plethora of\b|\ba myriad of\b", "vague quantity"),
    (r"\b(may|might|could) (potentially|possibly|perhaps)\b", "stacked hedge"),
    (r"\b(experts|researchers|scholars|studies|critics|observers) (say|suggest|argue|note|have shown|agree)\b", "vague authority (name the source)"),
    (r"\bit is widely (believed|accepted|recogni[sz]ed)\b", "vague authority"),
    (r",\s*(highlighting|underscoring|emphasi[sz]ing|showcasing|reflecting|fostering|reinforcing|cementing|solidifying|paving)\b", "vague participial tail"),
    (r"\b(first|second|third)ly\b|\blastly\b", "Firstly/Lastly enumeration"),
    (r"\blet['’]?s (dive|unpack|explore|delve|take a look)\b|\bhere['’]s the thing\b", "fake intimacy"),
    (r"\bthe (result|key|catch|takeaway|answer)\?", "setup-and-reveal"),
]

SENT_INITIAL_ADDITIVE = r"^(Additionally|Moreover|Furthermore|In addition|Also|Notably|Importantly|Interestingly|Significantly|Crucially|Ultimately|Overall)\b"

ABBREVIATIONS = {
    "e.g", "i.e", "al", "fig", "figs", "eq", "eqs", "sec", "tab", "vs", "cf", "dr", "mr",
    "ms", "prof", "no", "approx", "resp", "ref", "refs", "ch", "pp", "vol", "st", "etc",
}


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def split_sentences(text):
    """Return (start, end, sentence) tuples. Approximate but adequate."""
    spans = []
    for para in re.finditer(r"(?:[^\n]|\n(?!\s*\n))+", text):
        ptext = para.group(0)
        start = 0
        for m in re.finditer(r"[.!?](?=[\"'”’)\]]*\s+[A-Z(\[\"“])", ptext):
            prev = re.search(r"([A-Za-z.]+)$", ptext[:m.start()])
            if m.group(0) == "." and prev and (prev.group(1).lower() in ABBREVIATIONS
                                               or re.fullmatch(r"[A-Z]", prev.group(1))):
                continue
            end = m.end()
            spans.append((para.start() + start, para.start() + end, ptext[start:end]))
            start = end
        if ptext[start:].strip():
            spans.append((para.start() + start, para.end(), ptext[start:]))
    out = []
    for s, e, t in spans:
        lead = len(t) - len(t.lstrip())
        if len(re.findall(r"[A-Za-z]{2,}", t)) >= 3:
            out.append((s + lead, e, t[lead:]))
    return out


def word_count(s):
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’\-]*", s))


def sentence_at(sentences, pos):
    for s, e, t in sentences:
        if s <= pos < e:
            return t
    return ""


def snippet(text, start, end, width=50):
    a = max(0, start - width)
    b = min(len(text), end + width)
    return re.sub(r"\s+", " ", text[a:b]).strip()


# --------------------------------------------------------------------------
# Audit
# --------------------------------------------------------------------------


def audit(raw, is_tex):
    text = mask_text(raw, is_tex)
    if is_tex:
        # Drop LaTeX command names so \textbf, \section etc. do not count as words.
        prose = re.sub(r"\\[A-Za-z]+\*?", lambda m: " " * len(m.group(0)), text)
    else:
        prose = text
    sentences = split_sentences(prose)
    hits = []

    def add(kind, label, pos, end, note=""):
        hits.append({
            "line": line_of(raw, pos),
            "kind": kind,
            "label": label,
            "context": snippet(raw, pos, end),
            "note": note,
        })

    # Words
    for pattern, tier, keeps in WORDS:
        for m in re.finditer(pattern, prose, re.I):
            sent = sentence_at(sentences, m.start()) or prose[max(0, m.start() - 150):m.end() + 150]
            if any(re.search(k, sent, re.I) for k in keeps):
                continue
            add(f"word:{tier}", m.group(0).lower(), m.start(), m.end())

    # Templates
    for pattern, label in TEMPLATES:
        for m in re.finditer(pattern, prose, re.I):
            add("template", label, m.start(), m.end())

    # Sentence openers
    for s, e, t in sentences:
        lead = t.lstrip()
        off = s + (len(t) - len(lead))
        m = re.match(SENT_INITIAL_ADDITIVE, lead)
        if m:
            add("transition", f"sentence-initial '{m.group(1)}'", off, off + len(m.group(0)))
        if re.match(r"^However\b", lead):
            add("transition", "sentence-initial 'However'", off, off + 7,
                "move after the subject if the sentence allows it")

    # Punctuation
    for m in re.finditer(r"—|(?<!-)---(?!-)", prose):
        add("punct", "em dash", m.start(), m.end())
    for m in re.finditer(r"\s[–]\s|\s--\s", prose):
        add("punct", "spaced en dash as clause separator", m.start(), m.end(),
            "ranges like 2019–2023 are not flagged")
    for s, e, t in sentences:
        n = t.count(";")
        if not n:
            continue
        segments = t.split(";")
        # Serial-list semicolons: two or more in one sentence, or one followed by
        # "and"/"or" with commas on both sides ("Paris, France; and Rome, Italy").
        list_like = n >= 2 or (
            re.match(r"\s*(and|or)\b", segments[1]) is not None
            and "," in segments[0] and "," in segments[1]
        )
        for m in re.finditer(";", t):
            if list_like:
                add("punct", "semicolon (likely list separator, probably keep)", s + m.start(), s + m.end(),
                    "keep if it separates list items that contain commas")
            else:
                add("punct", "semicolon joining clauses", s + m.start(), s + m.end())
    for m in re.finditer(r"!(?!=)", prose):
        prev = prose[max(0, m.start() - 3):m.start()]
        if re.search(r"(\d|(?<![A-Za-z])[A-Za-z])$", prev):
            continue  # factorial such as n! or 5!
        add("punct", "exclamation mark", m.start(), m.end())
    for s, e, t in sentences:
        if t.rstrip().endswith("?"):
            rq = re.search(r"\b(RQ\d|research question|H\d)\b", t, re.I)
            add("punct", "question" + (" (looks like a research question, keep)" if rq else ""),
                s, e)
    for m in re.finditer(r":\s+(a|an|the)?\s*[a-z]+[^.\n]{0,40}\.", prose):
        before = prose[max(0, m.start() - 40):m.start()]
        if re.search(r"\b(the )?(result|answer|catch|key|takeaway|verdict|outcome)\s*$", before, re.I):
            add("punct", "colon before a punchline", m.start(), m.end())
    if not is_tex:
        for m in re.finditer(r"(?<![*\w])\*\*[^*\n]+\*\*(?=[^\n]*[a-z]{3,}[^\n]*[.!?]\s*$)", prose, re.M):
            line = prose[prose.rfind("\n", 0, m.start()) + 1:m.start()]
            if line.strip() and not re.match(r"^\s*([-*+]|\d+\.)\s*$", line):
                add("format", "bold inside running prose", m.start(), m.end())

    seen = set()
    hits = [h for h in hits
            if (k := (h["line"], h["label"], h["context"][:40])) not in seen and not seen.add(k)]
    hits.sort(key=lambda h: (h["line"], h["kind"]))

    # Paragraph clusters
    clusters = []
    for para in re.finditer(r"(?:[^\n]|\n(?!\s*\n))+", prose):
        lead = len(para.group(0)) - len(para.group(0).lstrip())
        a, b = line_of(raw, para.start() + lead), line_of(raw, para.end())
        n = sum(1 for h in hits if a <= h["line"] <= b and h["kind"] in ("word:high", "template", "transition"))
        if n >= 3:
            clusters.append({"lines": f"{a}-{b}", "markers": n})

    # Density words
    words = word_count(prose)
    density = {}
    for w in DENSITY_WORDS:
        c = len(re.findall(r"\b" + w + r"\b", prose, re.I))
        if c:
            density[w] = {"count": c, "per_1000": round(1000 * c / max(words, 1), 1)}

    # Sentence statistics
    lengths = [word_count(t) for _, _, t in sentences]
    stats = {"words": words, "sentences": len(lengths)}
    if len(lengths) >= 20:
        q = statistics.quantiles(lengths, n=4)
        stats.update({
            "median": statistics.median(lengths),
            "q1": q[0],
            "q3": q[2],
            "over_30_pct": round(100 * sum(x > 30 for x in lengths) / len(lengths)),
            "le_10_pct": round(100 * sum(x <= 10 for x in lengths) / len(lengths)),
        })
        runs = []
        for i in range(len(lengths) - 4):
            window = lengths[i:i + 5]
            if max(window) - min(window) <= 6:
                runs.append(line_of(raw, sentences[i][0]))
        merged = []
        for ln in runs:
            if not merged or ln - merged[-1] > 3:
                merged.append(ln)
        stats["uniform_runs_at_lines"] = merged
    else:
        stats["note"] = "fewer than 20 sentences; length statistics are not meaningful here"

    return {"hits": hits, "clusters": clusters, "density": density, "stats": stats}


def render(name, result):
    out = [f"# Audit: {name}", ""]
    out.append("Every item is a candidate for the necessity test (SKILL.md), not an error.")
    out.append("Keep an item when it is verbatim material, a term of art, required by the venue,")
    out.append("structurally needed, or the only way to keep the meaning.")
    out.append("")
    st = result["stats"]
    out.append(f"## Stats\n\n{st['words']} words, {st['sentences']} sentences.")
    if "median" in st:
        out.append(
            f"Sentence length: median {st['median']}, middle half {st['q1']:.0f} to {st['q3']:.0f}; "
            f"{st['over_30_pct']}% over 30 words, {st['le_10_pct']}% at 10 or fewer. "
            "Reference profile: median 15 to 21, about 1 in 6 over 30, about 1 in 10 at 10 or fewer."
        )
        if st["uniform_runs_at_lines"]:
            out.append("Runs of 5 sentences within 6 words of each other start near lines: "
                       + ", ".join(map(str, st["uniform_runs_at_lines"])))
    else:
        out.append(st["note"] + ".")
    out.append("")
    if result["clusters"]:
        out.append("## Paragraph clusters (3+ markers; rebuild around the facts, do not swap synonyms)\n")
        for c in result["clusters"]:
            out.append(f"- lines {c['lines']}: {c['markers']} markers")
        out.append("")
    groups = [
        ("word:high", "High-risk vocabulary"),
        ("template", "Templates"),
        ("transition", "Transitions"),
        ("word:editorial", "Editorial vocabulary (technical senses already filtered)"),
        ("punct", "Punctuation"),
        ("format", "Formatting"),
    ]
    for kind, title in groups:
        items = [h for h in result["hits"] if h["kind"] == kind]
        if not items:
            continue
        out.append(f"## {title} ({len(items)})\n")
        for h in items:
            note = f"  [{h['note']}]" if h["note"] else ""
            out.append(f"- L{h['line']}: {h['label']}: \"{h['context']}\"{note}")
        out.append("")
    heavy = {w: d for w, d in result["density"].items() if d["per_1000"] >= 3 or d["count"] >= 4}
    if heavy:
        out.append("## Density words (act only if a paragraph leans on them; never edit single instances)\n")
        for w, d in sorted(heavy.items(), key=lambda kv: -kv[1]["per_1000"]):
            out.append(f"- {w}: {d['count']} ({d['per_1000']} per 1,000 words)")
        out.append("")
    if not result["hits"]:
        out.append("No candidates found.")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+", help="files to audit, or - for stdin")
    ap.add_argument("--json", action="store_true", help="print JSON instead of a Markdown report")
    ap.add_argument("--tex", action="store_true", help="treat stdin as LaTeX")
    args = ap.parse_args()

    reports = {}
    for f in args.files:
        if f == "-":
            raw, name, is_tex = sys.stdin.read(), "stdin", args.tex
        else:
            path = Path(f)
            raw = path.read_text(encoding="utf-8", errors="replace")
            name, is_tex = str(path), path.suffix.lower() in (".tex", ".ltx", ".sty", ".cls") or args.tex
        reports[name] = audit(raw, is_tex)

    if args.json:
        print(json.dumps(reports, indent=2, ensure_ascii=False))
    else:
        print("\n\n".join(render(n, r) for n, r in reports.items()))


if __name__ == "__main__":
    main()
