---
name: paper-writer
description: Draft, revise, or audit academic and technical prose (papers, abstracts, theses, reports, grant sections, captions, rebuttals, technical blog posts) so it reads like a careful human expert wrote it, with specific claims, numbers with baselines, plain verbs, honest hedges, and none of the formulaic LLM patterns. Use it whenever the user asks to write or polish a paper section, make text sound less like AI, de-GPT or humanize a draft, tighten an abstract, fix wording in a LaTeX or Markdown manuscript, or check a draft for AI-sounding vocabulary, even if they never say the word paper. Edits are precise rather than mechanical. A flagged word or mark (delve, a semicolon, an em dash, significant) stays when it is a quotation, a title, a term of art, required by the venue, or the only way to keep the meaning.
license: MIT
---

# Paper Writer

Write and edit technical prose that a careful expert would sign: every sentence carries a fact, a definition, a reason, a choice, or a result, stated in plain words with the number attached. The aim is not to beat an AI detector. Detectors are probabilistic and often wrong. The aim is to remove the habits that make text generic: inflated vocabulary, stock templates, additive transitions, forced symmetry, vague authority, and claims without numbers.

## The two rules that govern everything else

### 1. Substance before style

Before touching wording, know the exact claim, the evidence for it, and the strongest concrete detail available (a number, a baseline, a mechanism, a named source). A paragraph with real evidence and causal reasoning reads as human even with plain wording. A paragraph with polished wording and no evidence does not, and no amount of synonym swapping fixes it.

### 2. Precision over pattern matching: the necessity test

Every "avoid", "never", and "0 in the source" in this skill and its references is a default, not a ban. The reference lists were built from corpus frequencies and from one exemplary paper. A word that is rare in that paper can still be the only correct word in yours.

A flagged word, phrase, or punctuation mark **stays** when any of these holds:

| Reason to keep | Examples |
|---|---|
| **A. Verbatim material** | A quotation, a cited title, a proper name, a dataset, model, or software name. Kobak et al.'s title "Delving into LLM-assisted writing..." keeps its "Delving". |
| **B. Term of art** | "statistically significant (p = 0.003)", "loss landscape", "robust standard errors", "key-value pairs", "critical value", "dynamic programming", "potential energy", "exploration bonus", "contrast-enhanced MRI", "fundamental frequency", "the Methods section". |
| **C. Required by the venue** | A mandated Limitations section, structured-abstract headings, the journal's serial-comma rule, APA's "e.g.," inside parentheses, a template's fixed heading wording. |
| **D. Structural need** | Removing it breaks the grammar or creates ambiguity: semicolons separating list items that themselves contain commas, an en dash in a range (2010–2020, pp. 4–9) or a two-name term (Michaelis–Menten), "therefore" carrying a step in a derivation, a colon before an equation, a question mark ending a stated research question. |
| **E. No equivalent** | The plain alternative changes or loses the meaning. "Although" marks a concession that "but" does not. "For example, when n = 3, ..." introduces a whole clause, which "such as" cannot do. "There exists a unique solution" is an existence claim, not filler. |

If none holds, rewrite. To decide, write the candidate replacement and reread both versions. If the replacement says less, says something different, is ungrammatical, or is ambiguous, keep the original. If the two are equivalent and the original is ornamental, use the replacement or delete.

`references/keep-list.md` lists the common technical senses and structural uses by word and by mark. Read it whenever you are about to remove or replace a flagged item and are not certain it is ornamental.

### Overcorrection is also a defect

Editing in the other direction damages text just as much. Do not:

- **Swap synonyms.** Changing "delve into" to "dig into", or "crucial" to "vital", keeps the ornament. Ask whether the word is needed at all, and usually the fix is a plain verb ("examines") or deletion.
- **Strip structural punctuation.** Turning "Paris, France; Rome, Italy; and Bonn, Germany" into commas makes the list unreadable.
- **Downgrade technical claims.** "Statistically significant (p = 0.003)" must not become "notable". "Robust standard errors" must not become "reliable standard errors".
- **Break logic.** Deleting the "Therefore" in a derivation makes a justified step look like an assertion. Splitting a sentence can leave a "This" with no clear antecedent.
- **Touch verbatim material.** Quotes, titles, names, citation keys, math, code, labels, and LaTeX commands stay byte-for-byte.
- **Chase metrics.** Do not shorten sentences to hit a median, or insert fragments for "rhythm". Sentence-length statistics describe documents of many paragraphs and say nothing about a three-sentence passage.
- **Flatten the author.** Keep their spelling variant (US or UK), their terminology, and recurring phrasings that are clearly theirs.
- **Fake humanity.** Never add errors, slang, anecdotes, or invented uncertainty.
- **Over-hedge or under-hedge.** Removing every "may" turns inferences into overclaims. Adding "may" everywhere is equally wrong. Hedge interpretation, not measurement.

## Modes

Pick the mode from the request. When unclear, revise if the user supplied text and draft if they supplied notes or results.

### Draft (the user gives notes, results, an outline, or a topic)

1. Collect every claim, number, baseline, cost, setting, and citation from what the user provided. **Never invent numbers, results, citations, quotations, or author names.** Where something is missing, write a visible placeholder such as `[CITE: original Adam paper]` or `[VALUE: training hours]` and list the placeholders after the draft.
2. Choose the structure. For an empirical ML or CS paper, follow `references/style-profile.md` section 3 (abstract sentence roles, introduction shape, method, results, conclusion). For other fields, use that field's conventions (IMRaD for medicine and life sciences, an argued thesis for humanities and position papers). A venue template overrides both.
3. Write with the core style below.
4. Self-audit: run `scripts/audit.py` on the draft, apply the necessity test to each hit, and fix what fails.

### Revise (the user gives text or a file)

1. Read the whole text first. For each paragraph, name its actual claim.
2. Preserve meaning, numbers, citations, math, code, quotations, LaTeX or Markdown markup, and the document's structure unless the user asked for restructuring. Output in the input's format: LaTeX stays LaTeX.
3. If the text is in a file, run `python scripts/audit.py <file>` for a candidate list. The script only finds candidates. It cannot judge necessity, so every hit still gets the test.
4. Work through the seven passes in `references/ai-patterns.md` section 17: claim and evidence, logic, vocabulary, templates, structure and rhythm, voice, compression.
5. Return the revised text, then brief notes. Keep the notes to three short lists, each only when non-empty:
   - **Changes that touch meaning:** anything a co-author should confirm.
   - **Kept on purpose:** flagged items you left in, each with its reason (A to E). List only items a reviewer might question.
   - **Needs evidence:** claims that have no number, baseline, or citation, which you could not fix without inventing something.

When the user points at a file and asks for it to be revised, edit the file in place so the diff is reviewable. Otherwise return the text in chat.

### Audit (the user wants a check, not a rewrite)

Run `scripts/audit.py`, then read the text yourself. Report findings in order of consequence:

1. Claims without evidence, results without baselines or margins, citations that look unverifiable.
2. Logic problems: additive chains where a causal relation is needed, conclusions that restate the abstract.
3. Template and vocabulary clusters (several markers in one paragraph matter more than one isolated word).
4. Punctuation and formatting.

For each finding, give the location, the problem in one sentence, and a suggested fix or "keep: reason".

## Core style

This is the condensed rule set. The full rules, measurements, and rewrite examples are in the references.

**Voice.** First person plural for actions and judgments ("We trained", "We chose", "We suspect"). Passive only where the agent is obvious ("Sentences were tokenized with BPE"), never to hide who decided. Single-author papers may use "I" if the field allows it. No contractions, rhetorical questions, or second person in a paper. Tutorials and blog posts can use "you".

**Sentences.** One claim per sentence with its condition attached ("faster when n < d"). Vary length by content: short sentences state a value or land a point, long ones carry a qualified claim. Attach reasons with "since", "because", or "as". Use "That is," to translate a formula into words. Put the purpose first: "To reduce variance, we average...". Prefer "To" over "In order to".

**Words.** Name the thing ("the scheduler", "self-attention"), not the category ("our method", "our novel framework"). Plain verbs: "is", "has", "uses", "shows", "examines". Describe what is new instead of calling it novel. Call the same thing by the same name throughout. Use "such as" for short example lists and "for example" when the example is a clause. Avoid ornamental words (delve, tapestry, testament, pivotal, underscore, showcase, foster, seamless, groundbreaking) unless one passes the necessity test.

**Numbers.** Every performance claim carries a number, a named baseline, and the margin in the metric's own units ("outperforms X by 2.0 BLEU, reaching 28.4"). Where a cost exists (time, hardware, data, parameters), report it next to the result. State each setting once with its symbol (N = 6, lr = 3e-4). Attach "about" or "nearly" to numbers, never "a large number of" when a number exists. "Significant" means a reported statistic or an adjacent number.

**Hedges.** One hedge word per claim, placed next to its reason or evidence: "We suspect X, since Y." Use "shows" for direct evidence, "suggests" for partial evidence, "is consistent with" for compatibility. State measurements flat. Report negative and neutral results in the same tone as wins. State the exception to every "all" and the scope of every "first".

**Connectives.** Additive openers ("Additionally,", "Moreover,", "Furthermore,") rarely carry anything, so start the next fact with its subject. Causal and concessive connectives ("because", "therefore", "although", "whereas", "unless") are correct whenever the relation is real, and they are standard in proofs. Prefer "X, however, Y" to a sentence-initial "However," when the sentence has a natural break after its subject.

**Punctuation.**

| Mark | Default | Keep when |
|---|---|---|
| Em dash (—, LaTeX `---`) | Replace with a comma, period, colon, or parentheses. | Verbatim material, or rare cases where no other mark keeps the reading. |
| En dash | Not as a clause separator. | Ranges (10–20, 2019–2023) and two-name terms (Navier–Stokes). Always keep these. |
| Semicolon | Split into two sentences. | Separating list items that contain commas, inside citations and reference formats, and verbatim material. |
| Colon | Introduces an equation, a formula, or a list. Never before a punchline. | Labels (RQ1:), ratios (3:1), times, title-subtitle in citations, definitions in run-in labels. |
| Question mark | None in body prose. | Stated research questions, quoted survey items, quoted dialogue. |
| Exclamation mark | None. | Factorials (n!) and verbatim material. |
| Bold and italics | Never for emphasis in running prose. | Run-in labels and tables (bold). Math variables, species names, titles, letters as letters, and terms your style guide italicizes (italics). |
| Slash | Write "and" or "or". | Units (m/s), ratios, fixed terms (I/O, TCP/IP, km/h). |
| Serial comma | Follow the venue's style guide and be consistent. | |

**Structure.** Headings are short noun phrases. Paragraph length follows content: one-sentence paragraphs for scope statements are fine, and a procedure may need seven sentences. No "In conclusion", no summary sentence at the end of each paragraph, no transition paragraphs between sections, no "Challenges and Future Outlook" boilerplate unless the venue requires it (and then name the actual limitation). Use a bulleted list only for three or more parallel items that each need sentences. Table captions state the finding as a sentence and define their symbols.

**Openings and endings.** Open with the specific situation, method, or result, not a panorama ("In today's rapidly evolving..."). End with a consequence, a concrete next step, or an unresolved question, never with ceremonial optimism.

## When the references disagree

`references/ai-patterns.md` is a general guide that recommends real logical connectives such as "therefore" and "although". `references/style-profile.md` measures one ML paper in which those words happen to appear zero times. Resolve conflicts this way:

1. Apply the necessity test in this file. It overrides every "never" in both references.
2. Treat the style profile's counts as a target profile for empirical CS and ML papers, not as quotas, and adapt it for other fields.
3. When a rule and the venue's style guide disagree, the venue wins.

## Files

- `references/ai-patterns.md`: the full catalogue of AI-associated vocabulary, sentence templates, structural habits, and content-level problems, with the seven-pass revision workflow (section 17) and before/after examples (section 18). Read for revise and audit work.
- `references/style-profile.md`: a measured profile of a well-written ML paper (sentence lengths, openers, hedges, punctuation) with section-by-section templates (section 3), rewrite examples on unrelated topics (section 15), and a pre-delivery checklist (section 16). Read for drafting, especially of empirical papers.
- `references/keep-list.md`: technical senses and structural uses that must survive editing, organized by word and by punctuation mark. Read before removing anything you are unsure about.
- `scripts/audit.py`: flags candidate patterns with line numbers in `.tex`, `.md`, or `.txt` files, or in text from stdin. It masks math, code, citations, quotations, and the bibliography, and it suppresses common technical collocations. Run `python scripts/audit.py draft.tex` (add `--json` for machine-readable output). Treat its output as a list of candidates for the necessity test, not as a list of errors.
