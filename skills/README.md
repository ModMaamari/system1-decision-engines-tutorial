# Claude skills for writing and reviewing papers

Each skill is shared as a single `.skill` file, which is a zip of its folder.

| Skill | File | What it does |
|---|---|---|
| `paper-writer` | `paper-writer.skill` | Drafts, revises and audits academic prose without formulaic LLM patterns. It is precise, not mechanical: a flagged word or mark stays when the meaning needs it. |
| `mg-review` | `mg-review.skill` | Reviews a paper the way reviewer MG does: labelled, location-anchored notes on legibility, claim scope, statistics, fairness, consistency and placement, each with a concrete action. |

## Install

The steps are the same for both skills. The commands below use `paper-writer.skill`; replace the file name for the other skill.

**Claude.ai or the Claude desktop app.** Open Settings, then Capabilities (or Skills), upload the `.skill` file, and enable it. If a chat shows the file with a **Save skill** button, clicking it installs the skill too.

**Claude Code, for one project.** Unzip the file into the project's `.claude/skills/` folder:

```bash
unzip paper-writer.skill -d .claude/skills/
```

**Claude Code, for every project.**

```bash
unzip paper-writer.skill -d ~/.claude/skills/
```

Then type `/paper-writer` or `/mg-review` followed by your request. You can also ask normally ("review my paper like MG would", "make this abstract sound less like AI") and Claude loads the matching skill.

To rebuild a `.skill` file after editing a skill folder:

```bash
cd skills && zip -r paper-writer.skill paper-writer -x "*/__pycache__/*"
```

---

# paper-writer

## What it does

- **Draft** a section from your notes and results. Missing numbers or citations become visible placeholders such as `[CITE: ...]`, never invented ones.
- **Revise** a passage or file. It returns the revision with short notes: changes that touch meaning, items it kept on purpose and why, and claims that need evidence.
- **Audit** a draft. It produces a ranked list of problems without rewriting.

`scripts/audit.py` scans `.tex`, `.md`, and `.txt` files using only the Python standard library. It masks math, code, citation keys, quotations, and the bibliography, suppresses technical collocations, and reports candidates with line numbers.

```bash
python paper-writer/scripts/audit.py draft.tex
```

## The precision rule

The skill is built from two source documents: a guide to avoiding AI-sounding prose, and a measured style profile of "Attention Is All You Need". Both were adjusted to stop overcorrection. Every "never" is now a default, and the necessity test overrides it. A flagged item stays when it is:

- **A.** A quotation, title, or name ("Delving into LLM-assisted writing..." keeps its "Delving").
- **B.** A term of art ("statistically significant (p = 0.003)", "loss landscape", "robust standard errors", "key-value pairs", "potential energy").
- **C.** Required by the venue (a mandated Limitations section, APA's "e.g." in parentheses).
- **D.** Structurally needed (semicolons between list items that contain commas, en dashes in ranges like 2019–2023, "therefore" in a proof, the question mark on a research question).
- **E.** Irreplaceable ("although" for a real concession, "for example" before a whole clause).

### Corrections made to the source documents

| Source rule | Problem | Corrected rule |
|---|---|---|
| Semicolons: never | Breaks lists whose items contain commas, and citation formats | Split clause-joining semicolons. Keep list and citation semicolons. |
| En dash: never in prose | Ranges and two-name terms need it | Only the spaced clause-separator en dash goes. |
| Question marks: never | Research questions are questions | Keep for stated research questions and quotations. |
| Exclamation marks: never | n! is a factorial | Keep in math and quotations. |
| Colons: only for equations and lists | Also needed for labels, ratios, and subtitles | Only the punchline colon goes. |
| Italics: 0 | Needed for math variables, species, titles | Never for emphasis. Required uses stay. |
| Slashes: never | Units (m/s) and fixed terms (I/O) | Write "and" or "or" except in units, ratios, and fixed terms. |
| "therefore, thus, although": banned | Contradicted the other guide. Proofs and concessions need them. | Allowed when the logical relation is real. |
| "for example, e.g., i.e., via": banned | "such as" cannot introduce a clause. Venues require "e.g." in parentheses. | Restricted to the uses that need them. |
| "method, framework, explore, address, robust, landscape, potential, novel...": banned | Each has a technical sense (Methods section, exploration bonus, memory address, robust SEs, loss landscape, potential energy, novel coronavirus) | Only the ornamental sense is avoided (keep-list.md). |
| "we argue", "you": banned | "We argue" is standard in position papers and the humanities. Tutorials address "you". | Allowed by genre. |
| "there is/are": avoid | Existence statements in math | Keep "there exists". |
| Sentence-initial "However": 0 | Grammatical, and sometimes the only unambiguous position | Prefer mid-sentence when possible. |
| "across, within, findings, potential..." flagged | Ordinary words that are corpus-level frequency signals | Act on density only, never on single instances. |
| "Delete many [transitions]" | Encourages deleting real logical connectives | Delete those that fail the checks and keep the rest. |
| Checklist counts of 0 and sentence-length targets | Applied to short passages, they push toward forced edits | Counts exclude legitimate uses. Statistics apply only to texts of about 20 sentences or more. |
| (missing) | Synonym swapping ("delve" to "dig into") was not named as a failure | Overcorrection is now listed as a defect alongside the AI patterns. |

---

# mg-review

## What it does

- **Review:** a first review of a paper given as PDF, LaTeX (it follows `\input`), Markdown or text. The output is a `<paper>.mg-review.md` file with one `[Review scope]` note, one `[Main priority]` note, then notes per section in reading order. Each note has an anchor (`S3.P2 · L118–131`), a label from MG's vocabulary, the quoted phrase, why it matters, what to do and what to keep. There is no score and no verdict.
- **Re-review:** a revised version is reviewed against the earlier review. Resolved points are marked `[Current review: improved]`, old notes stay as historical, and only the remaining priorities stay live.
- **Review and edit:** only when you allow it. Edits are conservative and keep the previous wording as comments, semantic changes are flagged separately, and numbers and results never change.
- **Inline comments:** on request, a copy of the source with `% MG [Label] ...` comments above each paragraph.

`scripts/paper_map.py` prints the section and paragraph anchors, with line ranges and page numbers for PDFs. With `--numbers`, it cross-references headline numbers from the abstract, introduction and conclusion against the rest of the paper and lists any that never appear in the tables or results.

```bash
python mg-review/scripts/paper_map.py paper.tex
```

```bash
python mg-review/scripts/paper_map.py paper.tex --numbers
```

The full review model is kept unchanged in `mg-review/references/mg-review-model.md`. The skill reads it before every review.

**Honesty rule:** the skill states in `[Review scope]` what it checked and what it did not. A cited source is reported as checked only when it was actually opened, with the section or equation that was checked.
