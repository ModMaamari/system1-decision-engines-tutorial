# Writing Instructions: Avoiding Formulaic “AI-Sounding” Prose

## Purpose

Write clear, specific, credible prose that sounds like a competent human author with a real point of view, not like a generic language-model completion.

The objective is **not** to “beat an AI detector.” AI detectors are probabilistic and can be wrong. The objective is to remove recurring LLM habits: formulaic rhetoric, inflated wording, generic transitions, excessive symmetry, vague claims, over-polished cadence, and stock vocabulary.

Every list in this file is a list of candidates, not of errors. The necessity test in SKILL.md decides each case: a flagged item stays when it is verbatim material, a term of art, required by the venue, structurally needed, or the only way to keep the meaning. `keep-list.md` lists the common technical senses. Removing a needed word is as much a defect as leaving an ornamental one.

These instructions apply to academic papers, reports, essays, articles, blog posts, commentary, professional writing, and social posts. Adapt the register to the genre.

## Contents

1 Substance before style · 2 Do not ban ordinary words · 3 High-risk vocabulary (3.1 research-backed markers, 3.2 editorially suspicious) · 4 Sentence templates (negative parallelism, significance inflation, broader-context inflation, participial tails, throat-clearing, transition chains, canned conclusions, challenges boilerplate) · 5 Structural habits · 6 Content-level signs · 7 Academic writing · 8 Articles and blogs · 9 Social posts · 10 Punctuation · 11 Do not humanize artificially · 12 Plain-verb check · 13 Specificity check · 14 Rhythm check · 15 Transition check · 16 AI-cluster check · 17 Seven-pass revision workflow · 18 Before/after examples · 19 Genre exceptions · 20 Final self-audit · 21 Compact prompt · 22 Research basis

---

## 1. Highest-priority rule: substance before style

Before polishing language:

1. Know the exact claim being made.
2. Know what evidence supports it.
3. State the claim as directly as the genre allows.
4. Use concrete nouns, specific verbs, dates, quantities, examples, mechanisms, named sources, and observable facts where available.
5. Remove sentences that merely announce importance, complexity, relevance, significance, or “broader implications” without adding information.
6. Do not hide weak reasoning behind elegant wording.

A passage that contains specific evidence, genuine causal reasoning, and authorial judgment usually sounds more human than a passage filled with stylistic variation but little substance.

---

## 2. Do not mechanically ban ordinary English words

The words below are not forbidden in isolation. Many are normal English and may be technically correct.

The risk comes from:

- unusually high density,
- repeated use,
- clustering several in one paragraph,
- using them where a simpler word would be more precise,
- using them as rhetorical decoration rather than for meaning.

If a flagged word is the best word, keep it. If it is ornamental, replace or delete it.

To tell the two apart, write the replacement and compare. If the replacement narrows or broadens the claim, drops a technical sense, or reads worse to a domain expert, the original was the best word.

---

# 3. High-risk AI-associated vocabulary

## 3.1 Strong research-backed markers

Treat these as **high-risk when clustered or repeated**, especially in academic, explanatory, and corporate prose:

- additionally
- align with / aligns with
- boasts
- bolstered
- crucial
- delve / delves / delved / delving
- emphasizing / emphasize
- enduring
- enhance / enhancing
- essential
- fostering / foster
- garner / garnered
- highlight / highlighting, especially as a generic verb
- interplay
- intricate / intricacies
- key, when used repeatedly as a vague adjective
- landscape, when used as an abstract metaphor
- meticulous / meticulously
- perfectly
- pivotal
- showcase / showcases / showcasing
- significant, when used as vague emphasis rather than statistical terminology
- tapestry, when used metaphorically
- testament
- underscore / underscores / underscoring
- valuable
- vibrant

Several of these have technical senses that are always correct: "significant" with a test statistic, "key" in key-value pairs or cryptography, "enhance" in image or contrast enhancement, "align" in sequence alignment or model alignment, "essential" in essential singularity, "perfectly" in perfect competition, "landscape" in loss landscape, "foster" in foster care. See `keep-list.md` section 3.

Also watch for academic terms that rose sharply in post-LLM scientific writing. These are ordinary prepositions, nouns and adverbs whose rise is visible only across millions of abstracts. Never edit a single instance because it appears here. Act only when one paragraph leans on them heavily (three "particularly"s, "insights" in every other sentence):

- across
- comprehensive
- exhibited
- findings
- insights
- notably
- particularly
- potential
- within

Other recurring research-associated words include:

- advancements
- comprehending
- groundbreaking
- realm
- surpass / surpasses / surpassing
- commendable
- innovative
- exceptional
- primarily
- thoroughly
- effectively
- noteworthy
- nuanced
- seamless
- transformative

### Preferred editing behavior

Do **not** perform thesaurus replacement. First ask whether the modifier or rhetorical verb is needed at all.

Examples:

- “This finding underscores the crucial importance of…”  
  → “This finding shows that…”

- “The study delves into the intricate interplay between X and Y.”  
  → “The study examines how X affects Y.”

- “The platform boasts a robust suite of features.”  
  → “The platform includes…”

- “These results offer valuable insights into…”  
  → State the insight directly.

- “This marks a pivotal shift in the evolving landscape of…”  
  → Name the actual change, date, mechanism, or consequence.

---

## 3.2 Editorially suspicious vocabulary: use only when it earns its place

These are not reliable proof of AI authorship, but dense use often makes prose sound generic, corporate, or model-generated:

- leverage, especially as a verb
- robust
- multifaceted
- holistic
- navigate
- ecosystem, as a vague metaphor
- unlock
- empower
- elevate
- dynamic
- ever-evolving
- cutting-edge
- game-changing
- seamless / seamlessly
- impactful
- meaningful, without specifying how
- compelling, without specifying why
- profound
- transformative
- revolutionary
- innovative, without a concrete innovation
- strategic, without specifying a strategy
- optimized
- streamlined
- comprehensive
- sophisticated
- powerful
- remarkable
- notable
- important
- critical
- vital
- foundational
- fundamental

Prefer concrete description over praise or abstraction.

Many words on this list are also terms of art: robust standard errors, dynamic programming, critical value, fundamental theorem, statistical power, comprehensive exam, optimized (when optimality is shown), navigation (robotics), ecosystem (ecology). Those uses stay.

---

# 4. Sentence templates that strongly sound like LLM prose

Avoid repeated use of these structures.

## 4.1 Negative parallelism

Especially avoid using these as a default rhetorical device:

- “It is not X; it is Y.”
- “It’s not X, it’s Y.”
- “This is not merely X, but Y.”
- “It is not just X, but also Y.”
- “Not only X, but also Y.”
- “This doesn’t just X; it Y.”
- “No X, no Y, just Z.”
- “X rather than Y” when used as a dramatic contrast without a real opposition.

Use contrast only when the distinction matters analytically. A contrast that prevents a likely misreading ("the gain comes from the tokenizer rather than the model size", when readers would assume model size) is analytical and stays.

Bad:
> This is not just a technical problem; it is a human problem.

Better:
> The technical failure changes how staff make decisions, so its effects are organizational as well as technical.

The second sentence explains the relationship instead of manufacturing drama.

---

## 4.2 Inflated significance templates

Avoid stock claims such as:

- “plays a crucial/pivotal/key role”
- “stands as a testament to”
- “serves as a reminder of”
- “underscores the importance of”
- “highlights the significance of”
- “reflects a broader trend”
- “marks a significant/pivotal moment”
- “marks a turning point”
- “sets the stage for”
- “shapes the future of”
- “leaves an indelible mark”
- “continues to resonate”
- “has far-reaching implications”
- “represents a paradigm shift”
- “redefines the landscape”
- “is emblematic of”
- “speaks to the broader issue of”

Replace importance claims with the specific consequence.

Bad:
> The ruling marked a pivotal moment in the evolving legal landscape.

Better:
> The ruling required lower courts to apply a different test beginning in 2025.

---

## 4.3 “Broader context” inflation

Be suspicious of sentences that attach a local fact to an abstract global narrative without evidence:

- “reflecting broader societal changes”
- “within the wider context of”
- “contributing to the broader discourse”
- “part of a broader movement”
- “in today’s rapidly changing world”
- “in today’s fast-paced digital landscape”
- “in an increasingly interconnected world”
- “in an era of unprecedented change”
- “as the world continues to evolve”

If the broader context is real, name it specifically.

---

## 4.4 Generic participial tail clauses

LLMs often attach an `-ing` clause that adds vague interpretation:

- “..., highlighting its importance.”
- “..., underscoring the need for…”
- “..., emphasizing the role of…”
- “..., showcasing the company’s commitment to…”
- “..., reflecting a broader shift toward…”
- “..., contributing to…”
- “..., fostering…”
- “..., ensuring…”
- “..., reinforcing…”
- “..., demonstrating…”

Use these only when the causal or interpretive relationship is explicit.

Bad:
> The city added two bus routes, enhancing accessibility and fostering community connectivity.

Better:
> The city added two bus routes. They cut the average trip to the hospital by 18 minutes.

---

## 4.5 Canned framing and throat-clearing

Usually delete or rewrite:

- “It is important to note that…”
- “It is worth noting that…”
- “It should be noted that…”
- “It is essential to understand that…”
- “It is crucial to recognize that…”
- “One key aspect is…”
- “A key consideration is…”
- “At its core…”
- “At the heart of…”
- “When it comes to…”
- “In terms of…”
- “In the context of…”
- “From a broader perspective…”
- “To better understand…”
- “To fully appreciate…”
- “As we have seen…”
- “Needless to say…”
- “The reality is that…”

Lead with the claim itself.

---

## 4.6 Additive-transition chains

Do not begin paragraph after paragraph with:

- Additionally,
- Moreover,
- Furthermore,
- In addition,
- Also,
- Notably,
- Importantly,
- Significantly,
- Interestingly,
- Consequently,
- Therefore,
- Thus,
- Hence,
- Meanwhile,
- On the other hand,
- In contrast,

Transitions are useful when they express a real logical relation. Do not use them merely to make disconnected points appear coherent.

The list mixes two kinds of word. Additive openers (Additionally, Moreover, Furthermore, In addition, Also, Notably, Importantly, Interestingly) rarely carry information and are the main target. Causal and contrastive connectives (Consequently, Therefore, Thus, Hence, In contrast, On the other hand) are correct whenever the relation is real. In proofs and derivations, "therefore", "thus" and "hence" mark logical steps and stay. The problem is only a chain of them opening paragraph after paragraph.

Prefer causal structure over additive stacking.

Weak:
> Additionally, the policy affects costs. Moreover, it changes staffing. Furthermore, it may affect compliance.

Better:
> The policy raises costs because firms must add a second review step. That staffing change also affects compliance deadlines.

---

## 4.7 Canned conclusions

Avoid default endings such as:

- “In conclusion…”
- “To conclude…”
- “Ultimately…”
- “Overall, it is clear that…”
- “The future looks promising…”
- “Looking ahead…”
- “As we move forward…”
- “Only time will tell…”
- “Despite these challenges…”
- “The path forward requires…”
- “By embracing X, we can…”
- “As X continues to evolve…”
- “X will remain a key part of…”

End with the strongest final implication, unresolved question, specific recommendation, or factual consequence.

---

## 4.8 “Challenges and opportunities” boilerplate

Avoid sections or paragraphs built automatically around:

- “Challenges and Opportunities”
- “Challenges and Future Directions”
- “Future Outlook”
- “Future Prospects”
- “Despite its success, X faces several challenges…”
- “Despite these challenges, X is well positioned to…”
- “While challenges remain, the future is promising…”

Only include a limitations/future-work section if the genre requires it or the content genuinely warrants it. Many venues now mandate a Limitations section, and then it must be written. Name the actual limitation and what would resolve it.

---

# 5. Structural habits that make prose sound AI-generated

## 5.1 Excessive symmetry

LLM prose often over-organizes ideas into neat, balanced units.

Watch for:

- every paragraph having nearly the same length,
- every section having exactly three points,
- every bullet having the same syntax,
- repeated “First…, Second…, Finally…” structures,
- introductions that preview exactly three themes,
- conclusions that repeat those same three themes,
- multiple sentences with identical grammatical frames.

Break symmetry when the content itself is not symmetric.

---

## 5.2 Rule-of-three overuse

Three-part lists are normal rhetoric, but repeated triads sound templated:

- “fast, secure, and scalable”
- “clarity, consistency, and confidence”
- “students, professionals, and lifelong learners”
- “innovation, collaboration, and growth”

Do not force reality into threes. Use two items if there are two. Use five if there are five.

---

## 5.3 Uniform sentence rhythm

Human prose typically has more variation in sentence length and structure.

Avoid a page where nearly every sentence:

- falls in the same word-count range,
- contains two balanced clauses,
- uses the same transition + claim + participial tail pattern,
- ends with an abstract noun,
- has the same polished cadence.

Mix sentence lengths naturally. Use short sentences when the point is simple. Use longer sentences only when the logic needs them.

Do not create fake variation by inserting random fragments.

---

## 5.4 Uniform paragraph rhythm

Avoid paragraphs that all:

1. open with a topic sentence,
2. give two generic supporting sentences,
3. end with a mini-conclusion about significance.

Some paragraphs should develop evidence. Some should explain a mechanism. Some should handle a counterexample. Some may be one sentence. Others may need six.

Let content determine paragraph shape.

---

## 5.5 Over-structuring

Use headings, bullets, tables, and boldface only when they improve retrieval or comprehension.

AI-coded formatting habits include:

- too many headings,
- Title Case For Every Heading,
- a heading every two paragraphs,
- excessive “Key Takeaways,”
- bolding ordinary phrases,
- bold label + colon + explanation on every bullet,
- unnecessary tiny tables,
- decorative emoji,
- horizontal rules between every section.

For papers and serious articles, default to ordinary prose unless structure genuinely helps.

---

# 6. Content-level signs of AI-like writing

## 6.1 Generic specificity deficit

AI prose often sounds polished while saying less than it appears to say.

Watch for sentences that contain:

- no names,
- no numbers,
- no dates,
- no examples,
- no quoted evidence,
- no mechanism,
- no source,
- no testable claim,
- no indication of scale.

Ask: **Could this sentence be pasted into an article about a different subject with only two nouns changed?**

If yes, rewrite it.

---

## 6.2 Vague authority

Avoid unsupported formulations such as:

- “Experts say…”
- “Researchers suggest…”
- “Observers note…”
- “Industry reports indicate…”
- “Critics argue…”
- “Studies have shown…”
- “It is widely believed…”
- “Many believe…”
- “There is growing recognition that…”

Name the source, study, institution, dataset, or group when possible.

If the evidence is mixed, say it is mixed.

---

## 6.3 False breadth

Do not imply a large consensus from one or two sources.

Avoid:

- “scholars agree” when one paper is cited,
- “several studies” when two are cited,
- “numerous reports” when the evidence set is small,
- “such as” when the list is actually exhaustive,
- “widely” when prevalence is unknown.

Use numerically honest language.

---

## 6.4 Superficial analysis after factual statements

Do not append an interpretation merely because a paragraph feels incomplete.

Typical AI pattern:

> Fact. Fact. Fact, highlighting X’s enduring importance and reflecting its broader significance.

If the facts already make the point, stop.

---

## 6.5 Promotional tone

Avoid sounding like a brochure, press release, or consultancy deck unless the genre calls for it.

Suspicious stock language includes:

- “boasts”
- “renowned”
- “vibrant”
- “rich heritage”
- “breathtaking”
- “nestled in”
- “world-class”
- “cutting-edge”
- “groundbreaking”
- “commitment to excellence”
- “dedication to”
- “seamlessly”
- “exceptional”
- “transformative”

Describe what exists instead of praising it.

---

## 6.6 Excessive balance and compulsory caveats

LLMs frequently produce safe, symmetrical “on the one hand / on the other hand” prose even when the evidence is asymmetric.

Do not invent a counterpoint solely for balance.

If one side is better supported, make that clear while accurately describing the competing view.

Avoid generic caveats such as:

- “While X offers many benefits, it also presents challenges.”
- “There are advantages and disadvantages.”
- “The answer depends on several factors.”
- “A balanced approach is needed.”

Specify the benefits, costs, conditions, and evidence.

---

## 6.7 No authorial stakes or judgment

In essays and analysis, writing can sound machine-made when it never reveals what the author thinks the evidence establishes.

Where the genre permits it:

- make the thesis explicit,
- distinguish observation from inference,
- state uncertainty precisely,
- say which evidence matters most and why,
- acknowledge what would change the conclusion.

Do not hide all judgment behind impersonal abstractions.

---

# 7. Academic-writing instructions

## 7.1 Prefer research verbs that describe the actual operation

Prefer:

- tests
- measures
- compares
- estimates
- examines
- identifies
- reports
- models
- samples
- observes
- finds
- argues
- distinguishes
- calculates
- evaluates

Use “explores” or “delves into” only when exploration is genuinely the method.

---

## 7.2 Do not inflate ordinary results

Avoid automatically calling findings:

- groundbreaking
- novel
- transformative
- pivotal
- remarkable
- compelling
- profound
- highly significant

If “significant” means statistically significant, report the statistic.

If a result matters, explain the effect size, consequence, or changed inference.

---

## 7.3 Use field-specific language, not generic “academic-sounding” language

Bad:
> A comprehensive understanding of the intricate interplay between these multifaceted factors is crucial.

Better:
> The model must separate the effect of age from the effect of treatment duration because the two variables are correlated.

Technical specificity sounds more credible than ornamental formality.

---

## 7.4 Build real logical relations

Prefer causal, conditional, contrastive, and evidential relationships over additive sequencing.

Do not connect ideas with “moreover” when the real relation is:

- because,
- therefore,
- unless,
- if,
- although,
- despite,
- whereas,
- only when,
- after,
- before,
- compared with.

State the relation the evidence supports.

---

## 7.5 Vary epistemic strength accurately

Use:

- “shows” for direct evidence,
- “suggests” for partial evidence,
- “is consistent with” for compatibility,
- “may” for genuine possibility,
- “is unlikely” when justified,
- “does not establish” when causal inference is unavailable.

Do not hedge every claim. Do not state uncertain claims as facts.

---

## 7.6 Do not fabricate citations or citation details

Never invent:

- titles,
- authors,
- journals,
- page ranges,
- DOIs,
- ISBNs,
- quotations,
- publication dates.

Verify references against the actual source.

A polished paragraph with a false reference is worse than an awkward paragraph with a real one.

---

# 8. Article and blog-post instructions

## 8.1 Skip generic openings

Avoid:

- “In today’s fast-paced world…”
- “In the digital age…”
- “Technology is changing the way we…”
- “Have you ever wondered…”
- “Imagine a world where…”
- “In an era where…”
- “Now more than ever…”

Open with:

- a fact,
- a scene,
- a concrete problem,
- a surprising result,
- a direct claim,
- a specific question that the article actually answers.

---

## 8.2 Avoid fake intimacy

Do not overuse:

- “Let’s dive in.”
- “Let’s unpack this.”
- “Here’s the thing.”
- “You might be wondering…”
- “The good news?”
- “The bad news?”
- “Sound familiar?”
- “Whether you’re a beginner, a professional, or somewhere in between…”

Use direct address only when it fits the publication’s voice.

---

## 8.3 Avoid click-copy rhythms

Watch for:

- one-sentence paragraphs repeated throughout,
- constant rhetorical questions,
- dramatic sentence fragments after colons,
- “The result? X.”
- “The key? Y.”
- “The takeaway? Z.”
- repeated “Here’s why.”
- repeated “But there’s a catch.”

A few can work. A whole article built from them sounds manufactured.

---

# 9. Social-post instructions

Social writing should not sound like a mini white paper.

Avoid:

- opening with a grand generalization,
- five emoji bullets,
- six abstract lessons,
- a forced inspirational conclusion,
- “Here are 7 key takeaways,”
- “This isn’t just X. It’s Y.”
- “The future belongs to…”
- “Agree?”

Prefer:

- one observation,
- one example,
- one conclusion,
- natural contractions,
- platform-appropriate brevity,
- a voice consistent with the actual author.

Do not manufacture vulnerability, personal experience, or anecdotes.

---

# 10. Punctuation and typography

## 10.1 Em dashes

Em dashes are normal punctuation. They are not proof of AI.

However, excessive use can now read as AI-coded in some contexts.

Guideline:

- Use an em dash when it is the best punctuation mark.
- Do not use one in every paragraph.
- Do not routinely use paired em dashes where commas or parentheses would be cleaner.
- Do not replace every colon with an em dash.

---

## 10.2 Oxford commas

Oxford commas are also normal and often required by house style.

Do not remove them merely to seem human.

Follow the publication’s style guide.

---

## 10.3 Curly quotes, title case, and formatting

Curly quotation marks are not evidence of AI.

Still, avoid automatic formatting habits that do not match the destination:

- Title Case in every heading,
- excessive bold,
- unnecessary horizontal rules,
- decorative emoji,
- README-style bullet formatting in an essay,
- small tables for information that belongs in one sentence.

Match the medium.

---

# 11. Words and structures NOT to “humanize” artificially

Do not intentionally add:

- spelling mistakes,
- grammar errors,
- random slang,
- fake personal anecdotes,
- fake uncertainty,
- sentence fragments with no rhetorical purpose,
- inconsistent capitalization,
- incorrect punctuation,
- invented quotations,
- unsupported opinions,
- needless repetition.

Human writing is not defined by mistakes.

The goal is **specific, purposeful, non-formulaic prose**.

---

# 12. The “plain verb” check

LLMs often avoid simple verbs in favor of inflated constructions.

Prefer plain forms when accurate:

- “is” over “serves as”
- “has” over “boasts”
- “shows” over “showcases”
- “says” over “articulates” when no distinction is needed
- “uses” over “leverages”
- “helps” over “facilitates” when the meaning is simply help
- “starts” over “commences”
- “causes” over “drives” when a causal claim is actually supported
- “includes” over “encompasses”
- “examines” over “delves into”
- “important” only when importance is explained

Do not avoid “is” and “are” just to sound sophisticated.

---

# 13. The specificity check

For every paragraph, ask:

- What is the most concrete noun here?
- What is the most informative verb?
- Is there a number, date, name, mechanism, example, or source that belongs here?
- Which sentence contains the actual claim?
- Can I delete the sentence that merely praises, frames, or summarizes the claim?
- Does the paragraph say *why* something happened, or only that several things exist?
- Could this paragraph fit 20 unrelated topics after swapping nouns?

If the answer to the last question is yes, rewrite.

---

# 14. The rhythm check

Read the passage aloud.

Rewrite if you hear:

- the same sentence length repeatedly,
- the same clause pattern repeatedly,
- three-item lists in every paragraph,
- every paragraph ending with an abstract moral,
- repeated “This + verb” openings,
- repeated transition words,
- repeated contrast pivots,
- repeated gerund endings.

Natural rhythm comes from varied thought, not random punctuation.

---

# 15. The transition check

Search the draft for:

`Additionally`, `Moreover`, `Furthermore`, `Notably`, `Importantly`, `In addition`, `However`, `Therefore`, `Thus`, `Consequently`.

For each occurrence, ask:

1. Is the logical relationship real?
2. Would the sentence be clearer without the transition?
3. Is a more specific connector needed, such as “because,” “although,” “after,” or “if”?
4. Has the same transition appeared recently?

Delete the ones that fail these checks. Keep the ones that pass, especially causal connectives in arguments and proofs.

---

# 16. The “AI cluster” check

A single marker is weak evidence. Clusters matter.

Rewrite a paragraph aggressively if it combines several of these:

- “Additionally”
- “pivotal”
- “landscape”
- “underscore”
- “intricate”
- “interplay”
- “showcase”
- “foster”
- “valuable insights”
- “tapestry”
- “testament”
- “not just X but Y”
- an em dash
- a three-item list
- a vague concluding `-ing` phrase

Do not merely swap synonyms. Rebuild the paragraph around its factual content.

---

# 17. Revision workflow for a writing agent

Perform these passes in order.

## Pass 1: Evidence and claim

- Identify the paragraph’s actual claim.
- Remove unsupported or generic statements.
- Verify names, numbers, dates, quotations, and citations.
- Add missing concrete evidence.

## Pass 2: Logic

- Label each sentence mentally as claim, evidence, explanation, counterpoint, implication, or transition.
- Remove sentences that perform no function.
- Replace additive sequencing with causal or conditional reasoning where supported.

## Pass 3: AI-vocabulary scan

Search for the high-risk words in Section 3.

- Delete ornamental instances.
- Replace only when a simpler, more precise word exists.
- Keep technical or semantically necessary uses (see `keep-list.md`).
- Never replace a flagged word with a synonym that is just as ornamental.

## Pass 4: Template scan

Search for:

- not just / not only / not merely
- it is not / this is not
- rather than
- stands as / serves as
- testament
- pivotal role
- crucial role
- underscores the
- highlights the importance
- despite these challenges
- future outlook
- in conclusion
- ultimately
- it is important to note
- at its core
- landscape
- tapestry

Rewrite repeated templates. Leave quotations, cited titles and names untouched even when they contain a template phrase.

## Pass 5: Structure and rhythm

- Break unnecessary triads. Keep lists of three when there are three things.
- Vary sentence and paragraph length according to content.
- Remove excessive headings, bullets, bold, and tables.
- Check whether every paragraph has the same shape.

## Pass 6: Voice

- Match the intended author, publication, discipline, and audience.
- Preserve legitimate quirks of the author’s voice.
- Prefer the author’s normal vocabulary over generic “better writing.”
- Do not make everything more formal.

## Pass 7: Final compression

Cut:

- throat-clearing,
- generic summaries,
- repeated conclusions,
- significance inflation,
- redundant adjectives,
- empty intensifiers,
- duplicate claims.

A shorter passage with sharper evidence is usually better.

---

# 18. Before/after examples

## Example A: Academic prose

AI-coded:
> Additionally, the findings underscore the crucial role of trust in fostering successful collaboration, highlighting the intricate interplay between organizational culture, communication, and leadership.

Better:
> Trust predicted collaboration scores even after the model controlled for team size and tenure. Interviews suggest one mechanism: teams were more willing to report errors when managers responded without punishment.

Why it is better:
- states the finding,
- names the controls,
- adds evidence,
- gives a mechanism,
- removes vague significance language.

---

## Example B: Technology article

AI-coded:
> In today’s rapidly evolving digital landscape, cybersecurity is not just a technical necessity but a pivotal component of organizational resilience.

Better:
> A ransomware attack can stop payroll, shipping, or clinical scheduling before it damages a single database. That is why cybersecurity belongs in continuity planning, not only in the IT budget.

Why it is better:
- opens with a concrete consequence,
- explains the claim,
- avoids generic era framing.

---

## Example C: Product description

AI-coded:
> The platform boasts a robust and intuitive interface that seamlessly empowers teams to unlock valuable insights and streamline workflows.

Better:
> The dashboard combines support tickets, response times, and customer scores on one screen. Managers can filter the data by team, product, or week.

Why it is better:
- names functions instead of praising them.

---

## Example D: Conclusion

AI-coded:
> In conclusion, while challenges remain, these advancements underscore the transformative potential of AI and pave the way for a more innovative and efficient future.

Better:
> The system reduced review time in this trial, but the study did not measure error costs after deployment. The next evaluation should test both speed and correction rates on live cases.

Why it is better:
- ends with the unresolved empirical issue,
- avoids ceremonial optimism.

---

# 19. Genre-sensitive exceptions

Do not blindly enforce these rules.

Keep a flagged expression when:

- it is a direct quotation,
- it is a technical term,
- it is part of a formal statistical phrase,
- a style guide requires it,
- the author genuinely uses it,
- changing it would reduce precision,
- the rhetorical pattern is deliberate and rare.

A real human voice can contain “delve,” an em dash, an Oxford comma, or “not only…but also.” The problem is patterned overuse and generic deployment.

Structural punctuation also stays: semicolons that separate list items containing commas, en dashes in ranges (2019–2023) and two-name terms (Navier–Stokes), colons before equations and in labels, and question marks ending stated research questions.

---

# 20. Final self-audit

Before returning a draft, verify all of the following:

- The opening reaches the subject quickly.
- The main claim is explicit.
- Most paragraphs contain concrete information.
- Vague importance claims have been removed.
- High-risk AI vocabulary is sparse and justified.
- No needed word, technical term, quotation, title or structural punctuation mark was removed or swapped for a synonym.
- “Not X but Y” structures are rare.
- Three-item lists are not mechanically repeated.
- Additive transitions are not carrying the argument.
- Sentence lengths vary naturally.
- Paragraph lengths vary naturally.
- Plain verbs are used where appropriate.
- “Is” and “are” have not been avoided for stylistic reasons.
- No paragraph ends with a generic moral unless the argument requires it.
- No “Challenges and Future Outlook” boilerplate appears by default.
- No fake personal experience or intentional error has been added.
- Citations and quotations are real and verified.
- The ending contributes a consequence, implication, recommendation, or unresolved question rather than repeating the introduction.
- The prose matches the genre and the author’s established voice.

---

# 21. Compact system prompt version

Use this block when you need a short instruction for another writing agent:

> Write specific, source-grounded prose, not generic “polished” prose. Every rule below is a default: keep a flagged word or mark when it is a quotation, a title, a technical term, required by the venue, or the only way to keep the meaning. Prefer concrete nouns, plain verbs, evidence, mechanisms, dates, numbers, names, and examples. Avoid clusters of stereotypical LLM vocabulary such as delve, intricate, interplay, pivotal, crucial, landscape, tapestry, testament, underscore, showcase, foster, enhance, valuable insights, vibrant, meticulous, groundbreaking, and additionally unless they are genuinely the most precise words. Avoid repeated negative parallelism (“not just X but Y,” “not X but Y”), rule-of-three lists, significance inflation, vague authority (“experts say”), generic `-ing` tail clauses (“highlighting…”, “underscoring…”), additive-transition chains, ceremonial conclusions, “challenges and future outlook” boilerplate, and unnecessary avoidance of simple “is/are/has” constructions. Do not force every paragraph into the same length or structure. Do not overuse headings, bullets, bold, em dashes, or title case. Vary rhythm naturally according to the thought. Never add fake mistakes or anecdotes to sound human. When editing, do not merely replace flagged words with synonyms; rebuild weak sentences around the factual claim and evidence. Match the author, genre, and publication rather than a generic professional voice.

---

# 22. Research basis behind these instructions

These rules synthesize findings and observations from:

- Juzek & Ward, *Why Does ChatGPT “Delve” So Much? Exploring the Sources of Lexical Overrepresentation in Large Language Models* (COLING 2025).
- Kobak, González-Márquez, Horvát & Lause, *Delving into LLM-assisted writing in biomedical publications through excess vocabulary* (Science Advances, 2025).
- Herbold et al., *A large-scale comparison of human-written versus ChatGPT-generated essays* (Scientific Reports, 2023).
- Research comparing ChatGPT-generated and human academic discourse, including work on lexical choice, syntactic complexity, formulaic sequences, metadiscourse, stance, and transitions.
- A 2026 rapid review of empirical literature on cues distinguishing AI-generated from human-written text.
- Pew Research Center’s 2026 Common Crawl analysis of AI-associated vocabulary, punctuation, and negative parallelism across 490,000 English-language webpages.
- Wikipedia WikiProject AI Cleanup’s descriptive field guide, *Signs of AI writing*, used here only as a practitioner/editorial source for recurring templates and formatting habits.

Important limitation: these are **probabilistic tendencies**, not proof of authorship. Model behavior changes over time, differs by prompt and genre, and increasingly influences human writing itself.
