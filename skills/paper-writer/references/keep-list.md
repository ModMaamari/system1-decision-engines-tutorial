# Keep List: Uses That Must Survive Editing

The other references list words, phrases, and marks to avoid. This file lists the cases where those same items are correct and must stay. It exists because mechanical editing ("remove every semicolon", "replace every 'significant'") damages precise text.

Use it with the necessity test in SKILL.md. Reasons are labeled A to E as there:

- **A.** Verbatim material: quotations, titles, names.
- **B.** Term of art.
- **C.** Required by the venue.
- **D.** Structural need: grammar or disambiguation.
- **E.** No plain equivalent keeps the meaning.

## Contents

1. Material that is never edited
2. Punctuation
3. Words with technical senses
4. Connectives and function words
5. Sentence patterns
6. Genre and venue exceptions
7. How to decide in unclear cases

---

## 1. Material that is never edited

Leave these byte-for-byte, even when they contain flagged items:

- Direct quotations and quoted survey or interview items.
- Titles of cited works, in prose or in the bibliography. "Delving into LLM-assisted writing in biomedical publications through excess vocabulary" keeps its "Delving". "Attention Is All You Need" keeps its title case.
- Proper names of models, datasets, software, institutions, and theorems: "RoBERTa" (robust is in the name), "Transformer", "Navier–Stokes", "Monte Carlo method".
- Math, code, identifiers, citation keys, labels, URLs, and LaTeX commands.
- Text the user marked as fixed (a mandated abstract, a quoted policy, legal wording).

## 2. Punctuation

### Semicolons

Keep them when:

- **They separate list items that contain internal commas (D).** "Participants came from Leeds, UK; Lyon, France; and Graz, Austria." With commas alone, the reader cannot tell where one item ends.
- **They appear inside citation formats (C).** Examples are "(Smith, 2020; Lee, 2021)" and reference lists.
- **They join two independent clauses where splitting breaks a tight parallel and no connective fits (E).** This case is rare. Most clause-joining semicolons read better as two sentences or with "whereas". Try both first.

Replace the semicolon in every other case.

### Em dashes

Em dashes almost always have a clean replacement: a comma, a colon, parentheses, or a new sentence. Keep them only in verbatim material (A), or where the venue's style uses them for a specific function such as an empty table cell (C).

### En dashes

Always keep them in these uses (D, C):

- Numeric and date ranges: "pp. 4–9", "2019–2023", "layers 3–6". In LaTeX these are written `--`, as in `4--9`.
- Compounds of two names or two equal parts: "Michaelis–Menten", "Navier–Stokes", "encoder–decoder" when the venue uses an en dash for it, "exploration–exploitation trade-off".
- Score lines and opposed pairs where the venue uses them: "a 3–2 vote".

Only the spaced en dash used as a clause separator ("the model – unlike its predecessor – converges") should change.

### Colons

Beyond introducing equations, formulas, and lists, keep colons in these uses:

- Labels: "RQ1:", "H2:", "Step 3:".
- Ratios and odds: "3:1", "a 1:4 dilution".
- Clock times and biblical or legal references.
- Title and subtitle separators in cited titles (A).
- Run-in labels: "Encoder: The encoder is composed of...".
- Formal definitions and theorem statements where the field uses them.

Only the colon before a dramatic reveal ("The result: a 30% speedup.") goes.

### Question marks

Keep them in:

- Explicitly stated research questions, both in the introduction and as labeled RQs (D, C).
- Quoted questions, survey items, and interview prompts (A).
- Titles of cited works (A).

Rhetorical questions in body prose go.

### Exclamation marks

Keep them in factorial notation (n!), in programming operators, and in verbatim material.

### Parentheses

Keep them for references ("(see Table 3)"), qualifiers ("(including ensembles)"), synonyms, values, abbreviation definitions ("byte-pair encoding (BPE)"), and required citation formats. Only commentary, jokes, and stacked hedges in parentheses go.

### Slashes

Keep them in:

- Units: m/s, km/h, mg/kg, tokens/s.
- Ratios and rates: "3/4 of runs".
- Fixed terms: I/O, TCP/IP, A/B test, read/write lock, and/or in legal or logical text where both readings must be allowed.

Everywhere else, write "and" or "or".

### Italics and bold

Italics are required (C, B) for:

- Mathematical variables in running text.
- Binomial species names (*Escherichia coli*).
- Titles of books and journals when the style guide requires it.
- Letters used as letters.
- Foreign terms the style guide italicizes.
- Defined terms in fields that italicize at first use.

Bold is fine in tables, run-in labels, and venue-required headings. Neither is used for emphasis.

### Serial (Oxford) comma

Follow the venue. Never add or remove it to "seem human".

### Quotation marks

Keep them for direct quotes, cited titles in some styles, and a newly named term on first use. Scare quotes around ordinary words go.

## 3. Words with technical senses

For each word, the ornamental use is what the other references target. The technical uses below stay. When the word appears in one of these collocations, it is correct.

| Word | Keep (technical or literal) | Rewrite (ornamental) |
|---|---|---|
| significant, significantly | statistically significant, significant at the 5% level, significance level, any use with a reported test statistic or p-value, significant figures or digits | "a significant step forward", "significantly improves" with no number |
| robust | robust standard errors, robust regression, robust statistics, robust optimization, robust control, robust estimator, "robust to X" when a test of X is reported, model names (RoBERTa) | "a robust framework", "robust performance" |
| landscape | loss landscape, energy landscape, fitness landscape, optimization landscape, literal landscapes (ecology, geography, landscape architecture) | "the evolving AI landscape" |
| key | cryptographic, primary, foreign, public, private, and API keys, key-value pairs, attention queries and keys, keyframe, key in music | "a key factor" repeated as vague emphasis |
| critical | critical value, point, temperature, exponent, path, section, region, mass, care, and race condition, critical theory | "it is critical that" |
| fundamental | fundamental theorem, frequency, group, solution, domain, mode, constant, and analysis (finance) | "a fundamental shift" |
| essential | essential singularity, supremum, spectrum, and hypertension, essential amino acids and genes | "it is essential to note" |
| dynamic | dynamic programming, range, system, equilibrium, and memory allocation, dynamic typing, dynamic time warping | "a dynamic landscape" |
| potential | potential energy, function, field, difference, game, and well, electric, chemical, membrane, and action potential | "the potential to transform", "potential" as a vague noun |
| vital, crucial | vital signs, vital statistics, vital capacity ("crucial" has no technical sense) | "plays a crucial role", "it is vital that" |
| novel | novel coronavirus, novel object recognition (neuroscience), literary novel | "a novel framework" (state what is new instead) |
| perfect, perfectly | perfect competition, information, matching, square, fluid, and conductor, perfectly elastic | "perfectly captures" |
| enhance, enhancement | image, contrast, signal, and speech enhancement, contrast-enhanced imaging, enhancer (genetics) | "enhances understanding" |
| align, alignment | sequence, multiple sequence, forced, and word alignment, model alignment and value alignment (AI safety), aligned memory | "aligns with our vision" |
| highlight | literal highlighting: "highlighted in bold in Table 2" | "highlights the importance of" |
| explore, exploration | exploration in reinforcement learning (exploration bonus, ε-greedy exploration), exploratory data analysis, an exploratory study whose design is exploratory | "we explore the intricate interplay" |
| navigate, navigation | robot or vehicle navigation, web or UI navigation studied as a task | "navigate the complexities" |
| address | memory address, IP address, addressing modes, "address reviewer comment 3" in a rebuttal | "address the challenge" (say what was done) |
| foster | foster care, parents, and children | "foster collaboration" |
| framework | a software framework (PyTorch, Django), a theoretical or conceptual framework in social science that the paper then specifies, a regulatory framework | "our framework" as a name for the work (name the thing) |
| method, approach | the Methods section (C), named methods (Newton's method, the method of moments, finite element method), a comparison of methods in a benchmark table | "our novel method" (name the thing) |
| insight | as a measured construct in psychology (insight problem solving) | "valuable insights" |
| intricate, interplay | almost never technical; keep only in verbatim material | nearly all uses |
| delve, tapestry, testament, showcase, underscore | no technical sense; keep only in verbatim material (titles, quotes) | all other uses |
| comprehensive | comprehensive exam (degree requirement), comprehensive metabolic panel (medicine) | "a comprehensive overview" |
| power, powerful | statistical power, a more powerful test, power analysis, electrical power, power law | "a powerful tool" |
| optimal, optimized | optimal when optimality is proven or the search space was exhausted | "optimal" for a setting chosen from a few tries |
| state of the art | a comparison against a named prior result on a named benchmark | "cutting-edge, state-of-the-art solution" |
| paradigm | programming paradigm, experimental paradigm (psychology, the standard task design) | "paradigm shift" |
| ecosystem | literal ecology | "the AI ecosystem" |
| interaction | interaction term or effect (statistics), drug interaction, human-computer interaction | "the complex interaction between" |
| across, within, findings, particularly, notably, primarily | ordinary prepositions and nouns; these are flagged only for density at corpus level | never edit a single instance just because the word is on a list |

## 4. Connectives and function words

| Item | Keep when | Rewrite when |
|---|---|---|
| therefore, thus, hence | A derivation or proof step follows from the previous line. A conclusion follows from stated evidence and the causal link is the point. | They join loosely related sentences, or open paragraph after paragraph. |
| although, though | A real concession: the main clause holds despite the subordinate one. | A plain "and" or a new sentence carries the same meaning. |
| however | A contrast. Prefer mid-sentence after the subject ("X, however, Y"). Sentence-initial is grammatical and stays when moving it creates ambiguity or the sentence has no natural break. | It signals a contrast that does not exist. |
| for example, for instance | The example is a full clause or a worked case: "For example, when n = 3, the bound gives...". | A short list of nouns, where "such as" fits. |
| e.g., i.e., etc. | Inside parentheses where the venue's style uses them (APA and many journals), and in tables and captions with tight space. | In running prose where "such as" or "that is" fits. |
| via | Literal routing or path: "connected via USB", "routed via the proxy", "administered via injection". | "via" as a vague synonym for "by" or "using". |
| note that | Mathematical writing, where it marks a fact the reader needs for the next step. | Throat-clearing before an ordinary claim. |
| there is / there are / there exists | Existence statements: "there exists a unique fixed point", "there is no closed-form solution". | "There are many factors that affect X" (start with the subject). |
| specifically | It narrows a general statement to a precise one that follows. | Filler. |
| additionally, moreover, furthermore | Almost never needed. Keep one if two lists of reasons would otherwise blur together. | Default: delete and start with the subject. |
| we argue, we believe, we think | Position papers, humanities, philosophy, law, and essays, where stating the thesis as an argument is the genre. "We argue" is the standard thesis marker there. | Empirical papers, where "we suspect" (mechanism), "we hypothesized" (design rationale), or "this suggests" (inference from data) is more precise. |
| you, your | Tutorials, documentation, textbooks, and blog posts addressed to the reader. | Research papers. |
| not only X but also Y | Once in a document, when the reader would otherwise assume only X. | As a default rhetorical frame. |
| X rather than Y | The reader could plausibly assume Y, so the contrast prevents a misreading. | Manufactured drama. |

## 5. Sentence patterns

- **Passive voice** stays when the agent is obvious or irrelevant (procedures, methods), and when the venue prefers it, as in some chemistry and medicine journals. It goes only when it hides a decision-maker.
- **Three-item lists** stay when there are three things. The rule targets triads padded for rhythm.
- **One-sentence paragraphs** are fine for scope statements and section openers.
- **Long sentences** stay when a qualified claim needs its conditions in one place. Do not split a sentence so that a condition drifts away from its claim.
- **Participial clauses** ("..., reducing latency by 40%") stay when the clause carries a measured, specific consequence. The target is the vague tail ("..., highlighting its importance").
- **"This" openers** stay when the antecedent is the immediately preceding mechanism. Add a noun ("This masking") when it is ambiguous. Do not delete them.

## 6. Genre and venue exceptions

- **Mandated sections:** Limitations, Broader Impact, Ethics Statement, Data Availability, Conflict of Interest. Write them when required, naming the actual limitation or impact.
- **Structured abstracts** (Background, Methods, Results, Conclusions) in medicine and some engineering venues use headings, and these override the abstract template in `style-profile.md`.
- **Highlights and key points boxes**, which some journals require, may be bullet fragments. Follow the journal.
- **Humanities and social science** writing uses "we argue" or "I argue", longer paragraphs, more hedged interpretation, and fewer numbers. Apply the specificity rule through named sources, dates, and quotations instead of metrics.
- **Rebuttals and response letters** address reviewers directly and may number points ("R2.3:").
- **Grant proposals** often require "Aims", "Significance", and "Innovation" sections by name (NIH). Keep the headings and make the content specific.
- **Theses** may require a chapter roadmap. One short paragraph is fine.

## 7. How to decide in unclear cases

1. Write the replacement.
2. Read the original and the replacement in context, including the sentence before and after.
3. Keep the original if the replacement:
   - narrows or broadens the claim,
   - drops a technical sense a domain reader would recognize,
   - breaks a list, range, or citation format,
   - leaves a logical step unsupported,
   - or reads worse to a domain expert.
4. Use the replacement if the two say the same thing and the original was ornament.
5. Still unsure? Keep the original and mention it under "Kept on purpose" so the author decides. A false positive costs the author one glance. A wrong edit can change a claim in a published paper.
