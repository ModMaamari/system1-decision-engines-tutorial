# Writing Style Reference

**Source.** This reference is derived from the LaTeX source of "Attention Is All You Need" (Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser and Polosukhin, arXiv:1706.03762v7). Every number below was measured on the paper's published prose (abstract through conclusion, plus figure and table captions) after removing commented-out drafts, tables, equations and the bibliography. That prose is about 3,750 words in 73 paragraphs.

**Purpose.** A writing agent uses this file to produce technical, scientific or analytical prose that reads as if a careful human expert wrote it. The rules are topic-neutral. Quoted examples come from the source paper. The rewrite examples in Section 15 use unrelated, invented topics to show that the rules transfer.

**How to use.** Sections 1 to 13 describe what to do. Section 14 lists what not to do. Section 15 shows rewrites. Section 16 is a checklist to run before delivering any text.

**How to read the counts.** Every count describes one 3,750-word ML conference paper. A count of 0 means the authors did not need that item, not that it is wrong. Treat the numbers as a target profile for empirical CS and ML writing, not as quotas, and adapt for other fields. Wherever this file says "never" or "do not use", the necessity test in SKILL.md takes precedence: a flagged item stays when it is verbatim material, a term of art, required by the venue, structurally needed, or the only way to keep the meaning. `keep-list.md` lists the common cases.

---

## 1. The voice in one paragraph

Plain, direct, first-person plural, quantified. The authors say what they did, what they measured, what they think it means, and where they are unsure. They use ordinary words ("simple", "faster", "hurts", "helpful") and give a number whenever they make a claim. Nearly every sentence carries a fact, a definition, a reason, a choice, or a result. There is no selling, no decoration, and no commentary on the writing itself. The tone is confident about measurements and modest about explanations.

---

## 2. Measured profile of the source

| Measure | Value in the source |
|---|---|
| Body prose | about 3,750 words, 73 paragraphs, about 170 sentences |
| Sentence length | median 18 words. Middle half between 12 and 25 words. Longest 53. Shortest full sentence 3 |
| Sentences over 30 words | about 1 in 6 |
| Sentences of 10 words or fewer | about 1 in 10 |
| Paragraph length | median 2 sentences, mean 2.6. 20 of 73 paragraphs are a single sentence. Longest is 7 |
| Sentences opening with "We" or "Our" | 38 (about 1 in 5) |
| Sentences containing "we" or "our" | 86 (about half) |
| Sentences with a passive construction | about 27 (about 1 in 6) |
| Em-dashes | 0 |
| En-dashes used as punctuation | 0 |
| Semicolons | 0 |
| Exclamation marks | 0 |
| Question marks | 0 |
| Colons | 8, each introducing an equation, a formula, or a list |
| Parenthetical asides | 18 |
| Double-quoted terms | 3, each a name given to a new component on first use |
| Footnotes | 3 (a short derivation, a list of constants, author contributions) |
| Bulleted lists in the body | 1 (three items, each item 2 to 4 sentences) |
| Run-in bold labels | 2 groups ("Encoder:" / "Decoder:", "Residual Dropout" / "Label Smoothing") |
| "however" | 5, all mid-sentence between commas, never at the start of a sentence |
| "Furthermore" | 1 |
| "In addition" | 3 |
| "Hence" | 1 |
| "Similarly" / "Similar to" | 3 |
| "very" | 3 |
| "significant" / "significantly" | 6, each attached to a quantified or tabulated claim |
| "simple" / "simpler" | 3 |
| "clearly" | 1 in the body, 1 in a caption |
| "surprisingly", "as expected", "excited" | 1 each |
| Hedged sentences ("we suspect", "we hypothesized", "may", "could", "appear to", "apparently", "seems", "suggests") | 7 |
| "we believe", "we think", "we argue" | 0 |
| "method", "framework", "insight", "novel" | 0 each |
| "approach" | 3 |
| Contractions, second person ("you"), "let us" | 0 |
| "i.e.", "e.g.", "etc.", "via" | 0 |
| "for example", "for instance" | 0 ("such as" is used 6 times instead) |

Words with zero occurrences in the source are listed in full in Section 14.2.

---

## 3. Document structure

The source is a conference paper. The section pattern generalizes to any report, article, or technical document.

### 3.1 Abstract (7 sentences, about 170 words)

Sentence roles, in order:

1. What the field currently uses. Declarative, no citations. "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder."
2. What the best of those have in common. "The best performing models also connect the encoder and decoder through an attention mechanism."
3. The proposal, named, described plainly, with what it removes. "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."
4. What the experiments show, as properties. "Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."
5. First headline number with the margin over the prior best. "Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU."
6. Second headline number with its cost. "... a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature."
7. Generalization to a second task, with its conditions. "We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data."

General template: current practice, shared property, our proposal and what it drops, what experiments show, number one with margin, number two with cost, generalization.

### 3.2 Introduction (4 paragraphs)

1. **Established state.** Name the dominant methods with citations. End with the fact that work continues on them. "Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures."
2. **Mechanism and its limit.** One sentence on how the dominant methods work. One sentence on the consequence. Then partial fixes. Then the limit that remains, in a short sentence: "The fundamental constraint of sequential computation, however, remains."
3. **The ingredient we build on, and the gap.** What the ingredient enables, then the gap: "In all but a few cases [citation], however, such attention mechanisms are used in conjunction with a recurrent network."
4. **What we propose.** One sentence naming it and what it replaces, one sentence with a result and a number. "In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs."

Notice the shape of paragraph 2: long sentence of mechanism, long sentence of consequence, medium sentence of partial fixes, then a 9-word sentence that lands the point.

### 3.3 Background or related work (4 short paragraphs)

- One paragraph per line of prior work. Each line is characterized by one measurable property, not by praise. "In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet."
- Then say how the proposed work differs on that same property, and concede its cost in the same sentence: "In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention as described in section 3.2."
- Define the central concept in one sentence and list where it has been used. "Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence."
- Close with the novelty claim, scoped, and a one-sentence roadmap. "To the best of our knowledge, however, the Transformer is the first transduction model relying entirely on self-attention ... In the following sections, we will describe the Transformer, motivate self-attention and discuss its advantages over models such as ..."

### 3.4 Method or system description

- Start from the framework everyone already knows, then position the new work inside it. "Most competitive neural sequence transduction models have an encoder-decoder structure [citations]. Here, the encoder maps ... The Transformer follows this overall architecture using ..."
- Go top-down: whole system, then each component in its own subsection, then the glue (embeddings, positions).
- For each component, in this order: what it is, the formula or rule, the concrete values used, why those values, and what alternatives were tried.
- State values inline with their symbols: "The encoder is composed of a stack of N=6 identical layers. Each layer has two sub-layers." "In this work we employ h=8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model/h = 64."
- Introduce an equation with a lead-in ending in a colon, then define every symbol immediately after it: "We compute the matrix of outputs as: [equation]" and "where pos is the position and i is the dimension."
- Give the practical reason for a design choice, not only the theoretical one: "dot-product attention is much faster and more space-efficient in practice, since it can be implemented using highly optimized matrix multiplication code."
- Offer a second way to see the same thing when it helps: "Another way of describing this is as two convolutions with kernel size 1."
- Record what was tried and rejected, with the evidence and the reason for the final choice: "We also experimented with using learned positional embeddings instead, and found that the two versions produced nearly identical results (see Table 3 row (E)). We chose the sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training."

### 3.5 Justification or analysis section ("Why X")

- Name the criteria explicitly and count them: "Motivating our use of self-attention we consider three desiderata." Then one short paragraph or sentence per criterion: "One is the total computational complexity per layer. Another is the amount of computation that can be parallelized ... The third is the path length between long-range dependencies in the network."
- Put the comparison in a table, then walk through it in prose one comparison at a time, each with the condition under which it holds: "self-attention layers are faster than recurrent layers when the sequence length n is smaller than the representation dimensionality d, which is most often the case with ..."
- Side benefits go last and are hedged: "As side benefit, self-attention could yield more interpretable models."

### 3.6 Experimental setup

- Open with a one-sentence statement of scope: "This section describes the training regime for our models."
- Subsections by topic (data, hardware and schedule, optimizer, regularization). Every subsection gives numbers: dataset size, vocabulary size, batch size, hardware, step time, total steps, wall-clock time, every hyperparameter.
- Passive voice is acceptable here for procedures whose agent is obvious: "Sentences were encoded using byte-pair encoding." "Sentence pairs were batched together by approximate sequence length."
- Where a value changed between settings, say so and give both: "The Transformer (big) model trained for English-to-French used dropout rate P_drop=0.1, instead of 0.3."

### 3.7 Results

- Main table first, with a caption that states the takeaway as a full sentence (see 3.9).
- One paragraph per task. Each result sentence names the task, the model, the number, the prior best, and the margin: "On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4."
- Follow with the cost of getting that result: "Training took 3.5 days on 8 P100 GPUs."
- Give the inference and selection procedure in plain sentences: checkpoint averaging, beam size, length penalty, how hyperparameters were chosen ("These hyperparameters were chosen after experimentation on the development set.").
- Explain how any derived number was computed, and put the constants in a footnote: "We estimate the number of floating point operations used to train a model by multiplying the training time, the number of GPUs used, and an estimate of the sustained single-precision floating-point capacity of each GPU."
- Ablations: say what was varied and what was held fixed, then report the effect, then say what it suggests. "In Table 3 rows (A), we vary the number of attention heads and the attention key and value dimensions, keeping the amount of computation constant ... While single-head attention is 0.9 BLEU worse than the best setting, quality also drops off with too many heads."
- Include negative and neutral findings: "In row (E) we replace our sinusoidal positional encoding with learned positional embeddings, and observe nearly identical results to the base model."
- State exceptions to a win explicitly: "yielding better results than all previously reported models with the exception of the Recurrent Neural Network Grammar."
- State the limits of the tuning that was done: "We performed only a small number of experiments to select the dropout ..., learning rates and beam size on the Section 22 development set, all other parameters remained unchanged from the English-to-German base translation model."

### 3.8 Conclusion (4 short paragraphs, about 150 words)

1. What was presented, in one sentence, with what it replaced: "In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention."
2. The results, restated in two or three sentences, without new numbers.
3. Concrete future work, named: other modalities, restricted attention for long inputs, less sequential generation. One sentence of feeling is allowed here: "We are excited about the future of attention-based models and plan to apply them to other tasks."
4. Where the code or data is.

No "In conclusion". No summary of the summary. No claims of far-reaching implications.

### 3.9 Headings, captions, footnotes

- Section headings are short noun phrases of 1 to 5 words: "Model Architecture", "Why Self-Attention", "Training", "Results", "Encoder and Decoder Stacks", "Hardware and Schedule", "Optimizer", "Regularization", "Positional Encoding". No colons, no questions, no verbs.
- A table caption states the finding as a sentence, then defines symbols and scope: "The Transformer achieves better BLEU scores than previous state-of-the-art models on the English-to-German and English-to-French newstest2014 tests at a fraction of the training cost." And: "n is the sequence length, d is the representation dimension, k is the kernel size of convolutions and r the size of the neighborhood in restricted self-attention."
- Captions say what is omitted and what must not be compared: "Unlisted values are identical to those of the base model." "Listed perplexities are per-wordpiece, according to our byte-pair encoding, and should not be compared to per-word perplexities."
- Figure captions describe what is shown and where it comes from, hedging interpretation: "Two attention heads, also in layer 5 of 6, apparently involved in anaphora resolution." Viewing instructions are allowed: "Best viewed in color."
- Footnotes hold a short derivation or a list of constants that would interrupt the sentence. Three footnotes in the whole paper.

---

## 4. Paragraphs

- **Length varies with content.** The median paragraph is 2 sentences. 20 of 73 paragraphs are one sentence. The longest is 7. Do not pad a one-sentence point into three sentences, and do not split a seven-sentence procedure into three paragraphs to look even.
- **Shape: mechanism, then consequence.** A sentence states how something works, and the next begins with "This" and states what follows from it. "Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states ... This inherently sequential nature precludes parallelization within training examples." Twelve sentences in the paper open with "This" in this role.
- **End on the point, not on a summary.** The introduction's second paragraph ends: "The fundamental constraint of sequential computation, however, remains." No paragraph ends with "In short" or "Overall".
- **One-sentence paragraphs are used for scope statements and transitions.** "This section describes the training regime for our models." "The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively."
- **No paragraph-level transitions.** Paragraphs do not begin with "Building on this", "With this in mind", or "Having established X". The next paragraph simply starts with the next thing.

---

## 5. Sentences

- **Mix lengths.** Quartiles are 12, 18 and 25 words. About 1 in 6 sentences exceeds 30 words. About 1 in 10 is 10 words or fewer. Long sentences carry qualified claims with conditions. Short ones land a point or state a value: "We used warmup_steps=4000." "Each layer has two sub-layers." "The encoder contains self-attention layers."
- **Openers, in measured order:** "We" (36), "In" (23), "The" (22), "This" (12), "For" (8), "To" (7), "On" (5), "While" (4).
  - "In ..." locates the sentence before the claim: "In Table 3 rows (A), we vary ...", "In practice, we compute ...", "In our model, we share ...", "In contrast to RNN sequence-to-sequence models, the Transformer outperforms ..."
  - "For ..." scopes a value to a setting: "For the base model, we use a rate of P_drop=0.1." "For the big models, we averaged the last 20 checkpoints."
  - "To ..." states the purpose first, then the action: "To counteract this effect, we scale the dot products by 1/sqrt(d_k)." "To facilitate these residual connections, all sub-layers in the model ... produce outputs of dimension d_model=512." "To evaluate if the Transformer can generalize to other tasks we performed experiments on English constituency parsing."
  - "On ..." names the task or object before the result: "On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.0 ..."
  - "While ..." concedes first, then states the finding: "While the two are similar in theoretical complexity, dot-product attention is much faster and more space-efficient in practice, since ..." "While single-head attention is 0.9 BLEU worse than the best setting, quality also drops off with too many heads."
- **First person plural is the default for actions and judgments.** "We propose", "We employ", "We trained", "We used", "We chose", "We suspect", "We plan", "We call", "We estimate", "We performed". Half of all sentences contain "we" or "our". The verbs are concrete. "We use" or "we used" (14) outnumbers "we employ" (5).
- **Passive voice only where the agent is obvious or irrelevant.** About 1 in 6 sentences. "Sentences were encoded using byte-pair encoding." "These hyperparameters were chosen after experimentation on the development set." Never use passive to avoid saying who decided something.
- **One claim per sentence, with its condition attached.** "self-attention layers are faster than recurrent layers when the sequence length n is smaller than the representation dimensionality d".
- **Reasons are attached with "since", "because", or "as".** "since it can be implemented using highly optimized matrix multiplication code." "because it may allow the model to extrapolate". "This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score."
- **Restatement in plain terms uses "That is,".** "That is, the output of each sub-layer is LayerNorm(x + Sublayer(x))." "That is, each dimension of the positional encoding corresponds to a sinusoid." Two uses in the paper. Use it to translate a formula or a technical phrase into words, not to repeat a point.
- **"In practice," moves from concept to implementation.** "In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix Q."
- **No contractions, no second person, no rhetorical questions.** Zero of each. A stated research question ("RQ1: Does X reduce Y?") is not rhetorical and keeps its question mark. Tutorials and documentation may address the reader as "you".

---

## 6. Word choice

- **Plain evaluative words, used rarely and with a number nearby.** "simple" (3), "faster" (3), "better" (2), "worse" (1), "hurts" (2), "helpful" (1), "easier" (1). "dropout is very helpful in avoiding over-fitting" follows a table row that shows the effect. "bigger models are better" follows rows (C) of the same table.
- **Name the thing, not the category.** The paper says "the Transformer", "the model", "self-attention", "scaled dot-product attention". It never says "our method", "our framework", or "our novel approach". "approach" appears 3 times, "method" and "framework" 0 times.
- **Describe what is new instead of calling it new.** "novel" appears 0 times. Novelty is stated as a scoped fact: "the first transduction model relying entirely on self-attention". "new" is attached to a measured score: "a new state-of-the-art BLEU score of 41.8".
- **"state of the art" is a measurement, not an adjective of praise.** All 8 uses refer to a specific prior best result on a named benchmark that the new number is compared against.
- **Intensifiers are scarce.** "very" 3, "extremely" 1 ("extremely small gradients", a technical description), "highly" 1 ("highly optimized matrix multiplication code"). "significantly" appears 6 times and each time a table or a number supports it.
- **Verbs of removal are specific:** "dispensing with recurrence and convolutions entirely", "eschewing recurrence", "replacing the recurrent layers ... with multi-headed self-attention". Say what is removed and what replaces it.
- **Concession words:** "albeit" (1), "despite" (1), "however" (5, always mid-sentence), "while" (6), "whereas" (1), "except" (2), "instead" (5), "with the exception of" (1). No "although", "nevertheless", "nonetheless", "that said".
- **Approximation words are attached to numbers:** "about 4.5 million sentence pairs", "about 37000 tokens", "approximately 25000 source tokens", "about 0.4 seconds", "nearly identical results", "more than 2.0 BLEU", "less than 1/4 the training cost", "as little as twelve hours". Never "roughly speaking" or "a large number" when a number is available.
- **"such as" introduces examples** (6 uses). "for example", "for instance", "e.g." and "i.e." appear 0 times. Use "such as" for a short list of nouns. When the example is a whole clause or a worked case ("For example, when n = 3, ..."), "such as" cannot replace it, so keep "for example". Keep "e.g." and "i.e." inside parentheses when the venue's style uses them.
- **Technical nouns dominate:** "model" (74), "mechanism" (11), "architecture" (8). Nouns are repeated rather than replaced by elegant variation. Call the same thing by the same name throughout.

---

## 7. Numbers and claims

- **Every performance claim carries a number, a baseline, and a margin.** Pattern: `[ours] [verb] [prior best, qualified] by [margin], [reaching absolute value]`. "outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4."
- **Every result carries its cost.** "Training took 3.5 days on 8 P100 GPUs." "at less than 1/4 the training cost of the previous state-of-the-art model." "at a fraction of the training cost of any of the competitive models."
- **Every setup value is stated once, with its symbol where one exists.** "N=6", "d_model=512", "h=8", "d_k=d_v=64", "d_ff=2048", "beta_1=0.9, beta_2=0.98 and epsilon=10^-9", "warmup_steps=4000", "P_drop=0.1", "epsilon_ls=0.1", "beam size of 4 and length penalty alpha=0.6", "100,000 steps or 12 hours", "300,000 steps (3.5 days)".
- **Give the unit and the scale.** "each training step took about 0.4 seconds", "checkpoints, which were written at 10-minute intervals", "36M sentences", "a 32000 word-piece vocabulary".
- **Give two forms when both help:** "100,000 steps or 12 hours". "input length + 50".
- **Say how derived numbers were derived** and put the constants in a footnote. "We used values of 2.8, 3.7, 6.0 and 9.5 TFLOPS for K80, K40, M40 and P100, respectively."
- **Deltas are expressed in the metric's own units:** "0.9 BLEU worse", "more than 2.0 BLEU", not "a substantial drop".
- **Digits for measured quantities.** Small counts may be spelled out in running prose ("eight GPUs", "twelve hours", "three desiderata") and written as digits in results ("8 P100 GPUs"). Be consistent within a sentence.
- **Comparisons name what is compared to:** "compared to" appears 0 times. The paper writes "X is 0.9 BLEU worse than Y", "faster than recurrent layers when ...", "identical to our algorithm, except for the scaling factor".

---

## 8. Connectives, contrast and transitions

- **Contrast is placed mid-sentence, after the subject, between commas.** All 5 uses of "however" follow this pattern:
  - "The fundamental constraint of sequential computation, however, remains."
  - "In all but a few cases [citation], however, such attention mechanisms are used in conjunction with a recurrent network."
  - "To the best of our knowledge, however, the Transformer is the first ..."
  - "Separable convolutions [citation], however, decrease the complexity considerably, to O(k*n*d + n*d^2)."
  - "Even with k=n, however, the complexity of a separable convolution is equal to ..."
  
  The subject comes first so the reader knows what the contrast is about before meeting "however".
- **Additive connectives are nearly absent.** "Furthermore" once, "In addition" three times (two of which are "In addition to X, ..." as a scoping phrase, not a connective). "Moreover", "Additionally", "Also" at sentence start: 0. Consecutive facts are simply stated in consecutive sentences.
- **Consequence connectives are nearly absent.** "Hence" once. "Therefore", "Thus", "Consequently", "As a result": 0. Consequence is carried by "This ..." sentences (Section 4) or by "so that": "The positional encodings have the same dimension d_model as the embeddings, so that the two can be summed." The source has no proofs. In derivations and proofs, "therefore", "thus" and "hence" mark a logical step and stay. Deleting one makes a justified step look like an assertion.
- **Purpose comes first:** "To this end, we add ...", "To counteract this effect, we scale ...", "in order for the model to make use of the order of the sequence, we must inject ...". "In order to" appears once. Prefer bare "To".
- **Similarity is signalled with "Similarly" or "Similar to", then the difference is stated immediately:** "Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions."
- **Signposting names content, not the act of writing.** "In this section we compare various aspects of self-attention layers to the recurrent and convolutional layers ..." "In the following sections, we will describe the Transformer, motivate self-attention and discuss its advantages over ..." Never "In this section we will discuss" without saying what.
- **Cross-reference phrases are short and concrete:** "as described in section 3.2", "As noted in Table 1", "see Table 3 row (E)", "See Figure 2", "described on the bottom line of table 3", "Table 2 summarizes our results".

---

## 9. Hedging, uncertainty and honesty

Seven of about 170 sentences are hedged. Each hedge is one word or phrase attached to one specific claim, and each hedge is followed or preceded by the reason for it.

- **Explanation of an observed effect:** "We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients." A footnote then gives the one-line variance argument. The fix that follows is stated without a hedge: "To counteract this effect, we scale the dot products by 1/sqrt(d_k)."
- **Reason for a choice among equals:** "We chose this function because we hypothesized it would allow the model to easily learn to attend by relative positions, since for any fixed offset k, PE_pos+k can be represented as a linear function of PE_pos." The hedge ("hypothesized") is on the benefit. The mathematical fact after "since" is not hedged.
- **Untested proposal:** "self-attention could be restricted to considering only a neighborhood of size r ... This would increase the maximum path length to O(n/r). We plan to investigate this approach further in future work."
- **Interpretation of an ablation:** "This suggests that determining compatibility is not easy and that a more sophisticated compatibility function than dot product may be beneficial."
- **Interpretation of qualitative evidence:** "many appear to exhibit behavior related to the syntactic and semantic structure of the sentences." Captions use "apparently involved in", "seems related to".
- **Novelty claim:** "To the best of our knowledge, however, the Transformer is the first ..."
- **Surprise is admitted once, with the reason:** "despite the lack of task-specific tuning our model performs surprisingly well".
- **Expectation is admitted once:** "as expected, bigger models are better, and dropout is very helpful in avoiding over-fitting."

Rules that follow:

1. Hedge the interpretation, not the measurement. Numbers are stated flat.
2. One hedge word per claim. Never "may potentially", "could possibly", "it is possible that ... might".
3. Every hedge sits next to its reason or its evidence.
4. Report negative and neutral results in the same tone as positive ones: "Results for the first experiment were slightly worse than for the base model, and results for the second experiment were slightly better."
5. State trade-offs inside the sentence that reports the benefit: "This hurts perplexity, as the model learns to be more unsure, but improves accuracy and BLEU score."
6. State the scope of what was tried: "We performed only a small number of experiments to select ..."
7. Name the exception to any "all": "better results than all previously reported models with the exception of ..."
8. "we believe" and "we think" are not used. Use "we suspect" for a mechanism, "we hypothesized" for a design rationale, "this suggests" for an inference from data. In position papers, humanities, philosophy and law, "we argue" (or "I argue") is the standard way to state a thesis and stays.

---

## 10. Definitions, names and notation

- **Define by function first, then by computation.** "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key."
- **Name a new component in double quotes once, then never quote it again.** "We call our particular attention "Scaled Dot-Product Attention"." "we add "positional encodings" to the input embeddings". "In "encoder-decoder attention" layers, the queries come from ...". Three named terms in the paper, three sets of quotes.
- **Position the new thing relative to the nearest known thing, with the exact difference.** "Dot-product attention is identical to our algorithm, except for the scaling factor of 1/sqrt(d_k)."
- **Give an alias when the field has one:** "Self-attention, sometimes called intra-attention".
- **Define symbols in the sentence after the formula:** "Where the projections are parameter matrices W_i^Q in R^(d_model x d_k), ..." "where pos is the position and i is the dimension."
- **Restate relationships between values:** "d_k = d_v = d_model/h = 64". "Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality."
- **Enumerate uses of a component in a list only when there are several parallel cases, each needing a few sentences.** The single bulleted list in the paper has three items, each 2 to 4 sentences, each beginning with where the inputs come from.

---

## 11. Cross-references and citations

- Citations follow the claim they support, inside the sentence, before the period. Several citations can share one bracket.
- A cited method is named in prose and cited once at first mention: "the Extended Neural GPU [citation], ByteNet [citation] and ConvS2S [citation]".
- Prior results are named by the authors' model name, not by "previous work has shown".
- Tables, figures and sections are referenced by number and, for tables, by row label: "Table 3 rows (A)", "row (E)", "Figure 1", "section 3.2", "the bottom line of Table 3".
- Reference the appendix by what it contains: "We inspect attention distributions from our models and present and discuss examples in the appendix."

---

## 12. Punctuation

| Mark | Use in the source | Default | Keep when |
|---|---|---|---|
| Em-dash (—) | 0 | Replace with a comma, a period, a colon, or parentheses. | Verbatim material. A clean replacement almost always exists. |
| En-dash (–) as a clause separator | 0 | Replace, as for the em-dash. | Not applicable. The en-dash in ranges ("pp. 4–9", "2019–2023") and two-name terms ("Navier–Stokes") is not a clause separator and always stays. |
| Semicolon | 0 | Split into two sentences. | Separating list items that contain internal commas ("Leeds, UK; Lyon, France; and Graz, Austria"), citation formats ("(Smith, 2020; Lee, 2021)"), verbatim material. |
| Colon | 8 | Introduce an equation, a formula, or a list. "We compute the matrix of outputs as:" "according to the formula:" "The Transformer uses multi-head attention in three different ways:" Never before a punchline. | Labels ("RQ1:"), ratios ("3:1"), times, title-subtitle separators in cited titles, run-in labels. |
| Parentheses | 18 | Short concrete asides only: a reference ("(see Table 3 row (E))"), a qualifier ("(including ensembles)"), a synonym ("dot-product (multiplicative) attention"), a value ("(setting to -inf)"), a location ("(described on the bottom line of table 3)"). Not for jokes, hedges, or commentary. | Abbreviation definitions and required citation formats. |
| Exclamation mark | 0 | None. | Factorials (n!) and verbatim material. |
| Question mark | 0 | None in body prose. | Stated research questions, quoted survey items, cited titles. |
| Double quotes | 3 terms | Naming a new component on first use. | Direct quotations. |
| Single quotes | captions only | Quoting a word token from data: `making', `its'. | |
| Comma before "however" | 5 of 5 | "X, however, Y." | |
| Serial comma | inconsistent in source | Follow the venue's style guide and keep one convention. | |
| Bold | tables and run-in labels only | Never for emphasis in running text. | |
| Italics | 0 in prose | Never for emphasis. | Math variables, species names, titles and terms the style guide italicizes. |

---

## 13. Lists and run-in labels

- **Bulleted lists:** one in the entire body. Use a list only when there are 3 or more parallel cases and each item is a full paragraph of 2 to 4 sentences. Never a list of fragments. Never a list of bolded lead-ins followed by one clause each.
- **Ordinal enumeration in prose:** "we consider three desiderata. One is ... Another is ... The third is ..." Use "One / Another / The third" or "First / Second / Third". Never "Firstly / Secondly / Lastly" (0 uses).
- **Run-in labels** ("Encoder:", "Decoder:", "Residual Dropout", "Label Smoothing") are used for 2 to 3 parallel sub-items when each is a substantive paragraph. Announce them with a count where possible: "We employ three types of regularization during training:".

---

## 14. Things to avoid

Each item below is absent from the source or restricted to the stated count. A writing agent that produces any item in 14.1 or 14.2 should apply the necessity test in SKILL.md to it before delivering: rewrite it unless it is verbatim material, a term of art, required by the venue, structurally needed, or the only way to keep the meaning (see `keep-list.md`). Do not swap a listed word for a synonym. Ask whether the word is needed at all.

### 14.1 Punctuation and typography

1. **Em-dashes (—) and spaced en-dashes ( – ) as clause separators.** 0 in 3,750 words. Replace with a comma, a period, or parentheses. En-dashes in ranges and two-name terms are not clause separators and stay.
2. **Semicolons joining clauses.** 0. Use a period. Semicolons that separate list items containing commas, or that sit inside citation formats, stay.
3. **Colons before a punchline** ("The result: a 30% speedup."). Colons introduce equations, formulas, or lists only.
4. **Exclamation marks.** 0.
5. **Rhetorical questions** ("But what happens when n grows?"). 0. State the case: "When n grows, ..." Stated research questions are not rhetorical and stay.
6. **Ellipses for effect.**
7. **Arrows (→, ⇒), checkmarks, emoji, or symbols in prose.** Arrows belong in math only.
8. **Bold or italic for emphasis in running text.** Bold appears only in tables and run-in labels.
9. **Scare quotes around ordinary words.** Quotes name a term once.
10. **Slash constructions** ("and/or", "input/output" as a phrase). Write "and", "or", or both words. Units (m/s), ratios, and fixed terms (I/O, TCP/IP, A/B test) stay.
11. **Headings with colons, questions, or verbs** ("Results: What We Found", "Why Does This Work?"). Headings are 1 to 5 word noun phrases.
12. **Nested bullet hierarchies and bullet-fragment lists.** One flat list in the whole paper, each item a paragraph.
13. **Parenthetical hedges or jokes** ("(admittedly)", "(pun intended)", "(more on this later)").

### 14.2 Words and phrases with zero occurrences in the source

Avoid the following by default. Each was checked and found absent in the source. Many have a technical or literal sense that stays; those are marked with † and listed in `keep-list.md` section 3. For example, "robust" in "robust standard errors", "landscape" in "loss landscape", "potential" in "potential energy", "explore" in "exploration bonus", "address" in "memory address", "method" in "Newton's method" or "the Methods section".

**Inflated verbs and nouns:** delve, leverage (verb), utilize, harness, unlock, empower, elevate, foster†, streamline, navigate (figurative)†, embark, journey, realm, landscape (figurative)†, tapestry, testament, paradigm†, synergy, holistic, insight†, avenue, framework (as a name for the work)†, method (as a name for the work)†, explore†, address (a problem)†, tackle, pave the way, play a role, shed light, underscore, highlight (verb)†, showcase, unpack, deep dive.

**Praise adjectives:** novel†, innovative, cutting-edge, groundbreaking, transformative, revolutionary, unprecedented, seamless, robust†, comprehensive†, powerful†, elegant, impressive, remarkable, promising, pivotal, paramount, crucial, vital†, nuanced, multifaceted, intricate, meticulous, myriad, plethora.

**Filler adverbs and stance markers:** essentially, basically, actually, really, truly, indeed, in fact, arguably, undoubtedly, certainly, obviously, of course, ultimately, in essence, interestingly, notably, importantly, crucially. ("specifically" moved to 14.3.)

**Connectives:** moreover, additionally, consequently, nevertheless, nonetheless, that said, firstly, secondly, lastly, in conclusion, in summary, to sum up, overall (as a summarizer), going forward, moving forward. ("therefore", "thus" and "although" moved to 14.3: they express real logical relations and are standard in proofs and concessions.)

**Meta-phrases:** it is worth noting, it should be noted, it is important to note, needless to say, as mentioned earlier, as we will see, we believe, we think, let us, let's. ("note that", "we argue" and "you" moved to 14.3.)

**Abbreviations and Latinisms:** vis-a-vis, per se. ("i.e.", "e.g.", "etc." and "via" moved to 14.3.)

**Examples:** "for instance". Use "such as" for short noun lists. ("for example" moved to 14.3.)

**Vague quantity:** a wide range of, a variety of, a number of, numerous (1 use in the source, avoid), various (2 uses in the source, avoid), many (only with a countable referent), significant (without a number).

**Potential and aims:** potential (noun)†, aims to, seeks to, strives to, endeavors to, has the potential to, opens the door to, holds promise.

### 14.3 Restricted words (present in the source, but rare)

| Word | Count in source | Rule |
|---|---|---|
| very | 3 | At most one per 1,000 words, and only with a measurable referent nearby. |
| significant / significantly | 6 | Only when the magnitude is in the same sentence or an adjacent table. |
| simple / simpler | 3 | Only to describe a mechanism whose simplicity is visible in the description. |
| clearly | 1 body, 1 caption | At most once per document, and only about something the reader can verify in a figure. |
| surprisingly | 1 | At most once, with the reason for the surprise. |
| as expected | 1 | At most once, after the expectation was stated earlier. |
| excited, grateful | 1 each | Conclusion and acknowledgements only. |
| Furthermore | 1 | At most once. Prefer starting the next fact with its subject. |
| Hence | 1 | At most once. Prefer "This ..." consequence sentences. |
| state of the art | 8 | Only as a comparison against a named prior result on a named benchmark. |
| push the boundaries | 1 | Avoid. |
| in order to | 1 | Use "To". |
| in terms of | 1 | Avoid. Rephrase as "X is faster when ...". |
| there is / there are | 1 | Avoid. Start with the subject. |
| employ | 5 | Use "use" at least twice as often as "employ". |
| allow / allows | 7 | Fine when literal ("allows every position in the decoder to attend over all positions"). Not as a synonym for "enables us to". |
| ensure / ensures | 2 | Literal only ("ensures that the predictions for position i can depend only on ..."). Never "to ensure clarity". |
| therefore / thus | 0 | In proofs and derivations, where they mark a logical step. Elsewhere, only when the causal link is the point. Never as a paragraph opener in a chain. |
| although | 0 | When the relation is a real concession. Prefer it over "while" when "while" could be read as temporal. |
| for example | 0 | When the example is a full clause or a worked case. Use "such as" for a short noun list. |
| e.g. / i.e. / etc. | 0 | Inside parentheses, tables and captions when the venue's style uses them. In running prose write "such as" and "that is". |
| via | 0 | Literal routing or path ("connected via USB", "administered via injection"). Not as a vague "by" or "using". |
| note that | 0 body, 1 caption | In mathematical writing, to flag a fact needed for the next step. Not as throat-clearing. |
| specifically | 0 | When it narrows a general statement to a precise one that follows. |
| there exists / there is | 1 | Existence statements ("there exists a unique fixed point", "there is no closed-form solution"). |
| we argue | 0 | Position papers, humanities, philosophy and law, where it states the thesis. |
| you / your | 0 | Tutorials, documentation and textbooks only. |

### 14.4 Sentence-level patterns to avoid

1. **Sentence-initial "However,".** All 5 uses in the source are mid-sentence: "X, however, Y." Move it after the subject when the sentence has a natural break there. Sentence-initial "However," is grammatical and stays when moving it would create ambiguity.
2. **Stacked hedges** ("may potentially", "could possibly", "it is possible that this might"). One hedge word per claim.
3. **The "not only X, but also Y" frame.** One use in the source. Do not use it more than once per document.
4. **The "not X, but Y" or "it's not about X, it's about Y" antithesis.** 0.
5. **Negative parallelism** ("no recurrence, no convolution, just attention"). 0. The source writes "dispensing with recurrence and convolutions entirely".
6. **Triplets of adjectives for rhythm** ("fast, scalable, and reliable"). Lists of three in the source are lists of three things, each defined.
7. **Fragments for punch** ("Fast. Simple. Done."). 0.
8. **Setup-and-reveal** ("Here's the thing:", "The catch?", "The result?"). 0.
9. **Sentences that announce content instead of delivering it** ("It is important to understand the role of X."). Deliver X.
10. **"This" as a bare subject with an unclear antecedent.** "This" sentences in the source refer to the mechanism in the immediately preceding sentence. When ambiguous, write "This masking", "This inherently sequential nature".
11. **Passive constructions that hide the decision-maker** ("It was decided that", "Experiments were conducted"). Write "We chose", "We performed experiments".
12. **Uniform sentence length.** The source's quartiles are 12, 18, 25. If five consecutive sentences are all between 18 and 24 words, rewrite one to be short and one to carry a qualified claim.
13. **Restating the claim at the end of the sentence** ("..., which shows the importance of X"). The number shows it.
14. **Question-form headings or leads** ("So how does it work?").
15. **Anthropomorphic praise of the work** ("our model elegantly handles", "the architecture gracefully degrades").
16. **Explaining the obvious to an expert reader.** The source defines "self-attention" in one sentence and moves on.
17. **Ending a sentence with a vague benefit** ("... leading to better outcomes", "... improving overall performance"). End with the metric and the number.

### 14.5 Paragraph and document-level patterns to avoid

1. **Opening with a panorama** ("In today's rapidly evolving landscape of ...", "In recent years, X has garnered significant attention"). The source opens with the specific dominant methods and citations.
2. **Paragraphs that all have the same shape** (topic sentence, three supports, wrap-up). Source paragraphs range from 1 to 7 sentences and end on the point.
3. **Summary sentences at the end of paragraphs** ("In short, ...", "Overall, ...", "Taken together, ...").
4. **Transition paragraphs or transition sentences between sections** ("Having described the model, we now turn to training."). The source's section openers state scope directly: "This section describes the training regime for our models."
5. **Conclusions that open with "In conclusion" or restate the abstract verbatim.** The source's conclusion starts "In this work, we presented ...", restates results in different words, gives concrete future work, and gives the code link.
6. **Closing with implications, calls to action, or questions** ("This opens exciting avenues", "We invite the community to ...").
7. **Bulleted "key takeaways" or "contributions" lists** with bolded lead-ins. Contributions in the source are stated in prose in the abstract and introduction.
8. **Both-sidesing without specifics** ("While X has advantages, it also has limitations."). The source names the limitation and its size: "albeit at the cost of reduced effective resolution due to averaging attention-weighted positions".
9. **Repeating a number in three places with different phrasing.** Each number appears where it is first needed and is referenced by table afterwards.
10. **Disclaimers about complexity or perspective** ("This is a complex topic", "There are many views on this").
11. **Describing the document's own organization at length.** One sentence of roadmap at the end of the background section is the source's only roadmap.

### 14.6 Claims to avoid

1. **Unquantified superlatives** ("dramatically faster", "vastly superior", "orders of magnitude" without the orders).
2. **"Solves", "eliminates", "guarantees"** for empirical results. The source uses "improving over", "outperforms ... by", "achieves", "establishes".
3. **Universal claims without the exception.** The source writes "all previously reported models with the exception of ...".
4. **Calling a design choice optimal** when only a few settings were tried. The source writes "We performed only a small number of experiments to select ..."
5. **Attributing intent to a model** without hedging ("the model learns to focus on syntax"). The source writes "many appear to exhibit behavior related to the syntactic and semantic structure".
6. **Reporting only wins.** The source reports "slightly worse" and "nearly identical" results in the same tone as records.

---

## 15. Rewrite examples on unrelated topics

The left version exhibits the patterns in Section 14. The right version follows Sections 1 to 13. Numbers are invented for illustration.

### 15.1 Opening paragraph

**Avoid:**
> In today's rapidly evolving energy landscape, battery storage has emerged as a crucial enabler—one that promises to unlock unprecedented grid flexibility. However, existing scheduling approaches remain limited. Our novel framework leverages a comprehensive optimization strategy; moreover, it seamlessly integrates with existing infrastructure.

**Write:**
> Grid operators use battery storage to shift supply from hours of surplus to hours of deficit. Current schedulers plan charge and discharge once a day, one day ahead, using a price forecast [citations]. Intraday price changes are therefore ignored, and the schedule is stale within hours. Recent work replans hourly with a linear program [citation], which recovers part of the lost revenue at the cost of a solver call each hour. The dependence on a day-ahead forecast, however, remains.
>
> In this work we propose a scheduler that replans every 15 minutes from the same inputs, dispensing with the day-ahead forecast entirely. On one year of hourly prices from a regional market, it raises revenue per megawatt-hour of capacity by 11% over the day-ahead baseline and runs in under two seconds per step on one CPU core.

### 15.2 Method description

**Avoid:**
> Our approach utilizes a two-stage pipeline. Firstly, an encoder module extracts robust features; secondly, a decoder module generates the output. It is worth noting that this design ensures both efficiency and accuracy.

**Write:**
> The classifier is composed of two stages. The first is a convolutional encoder with L=4 layers that maps a 224 x 224 image to a 512-dimensional vector. The second is a linear layer followed by a softmax over the C=37 classes. We apply dropout with P_drop=0.2 to the encoder output. That is, the prediction is softmax(W * dropout(Enc(x)) + b). We chose four layers because accuracy on the development set flattens beyond it (Table 2, rows (B)).

### 15.3 Justifying a choice with a hedge

**Avoid:**
> The performance degradation could potentially be attributed to a variety of factors, possibly including overfitting, which may or may not be mitigated through regularization.

**Write:**
> We suspect the model overfits the 40K training sentences, since training loss reaches 0.3 while development loss stops improving after 8K steps. Doubling dropout to 0.2 recovers 0.6 F1 on the development set, which is consistent with this explanation.

### 15.4 Reporting an ablation

**Avoid:**
> Interestingly, the ablation study reveals several key insights. Firstly, removing the attention module leads to a significant performance drop, highlighting its critical importance. Secondly, increasing the hidden size yields diminishing returns, underscoring the need for a nuanced approach.

**Write:**
> In Table 4 rows (A), we remove the attention module and keep everything else fixed. Accuracy drops from 91.2 to 84.5. In rows (B) we vary the hidden size from 128 to 1024. Accuracy improves up to 512 and is within 0.2 points beyond it, while training time doubles at each step. We use 512 for the remaining experiments.

### 15.5 Stating a trade-off

**Avoid:**
> While our compression scheme offers substantial benefits, it is not without its limitations, which we acknowledge.

**Write:**
> Quantizing the weights to 8 bits reduces model size by 3.9x and inference latency by 2.1x on the target CPU. This costs 0.4 points of top-1 accuracy, as the last two layers are sensitive to rounding. Keeping those two layers at 16 bits recovers 0.3 of the 0.4 points at a 6% size increase.

### 15.6 Conclusion

**Avoid:**
> In conclusion, this work has presented a comprehensive framework that not only advances the state of the art but also opens exciting new avenues for future research. We believe our findings will have far-reaching implications across a wide range of domains.

**Write:**
> In this work, we presented a replanning scheduler for grid batteries, the first that requires no day-ahead price forecast. On both regional markets we tested, it raises revenue over the day-ahead baseline, and on the smaller market it also outperforms the hourly linear-program scheduler at one-tenth of its solver time.
>
> We plan to extend the scheduler to fleets of batteries with shared transmission limits and to test it against real-time dispatch signals rather than historical prices.
>
> The code and the price data we used are available at [URL].

### 15.7 Caption

**Avoid:**
> Figure 3: Results.

**Write:**
> Figure 3: Revenue per megawatt-hour for each scheduler on the 2023 prices. The replanning scheduler is above the day-ahead baseline in every month. Values are averaged over 5 random seeds. Error bars show one standard deviation.

---

## 16. Checklist before delivering text

Run each check. Fix every failure.

**Search and count:**
- [ ] Em-dashes and clause-separating en-dashes: 0 outside verbatim material. Range and two-name en-dashes untouched.
- [ ] Semicolons: 0, except between list items that contain commas, in citation formats, and in verbatim material.
- [ ] Exclamation marks and question marks in body prose: 0, except factorials, stated research questions and quotations.
- [ ] Sentence-initial "However": moved mid-sentence wherever the sentence allows it. Mid-sentence "however": at most about 1 per 700 words.
- [ ] Every word in Section 14.2: 0 ornamental uses. Technical senses (†) and verbatim material untouched.
- [ ] Every word in Section 14.3: within its limit and in its allowed sense.
- [ ] "e.g.", "i.e.", "etc." in running prose: 0. "for example" only before a clause.
- [ ] No flagged item was replaced by a mere synonym. Quotations, titles, names, math and code unchanged.
- [ ] Bold or italics inside running prose: 0.
- [ ] Bulleted lists: at most 1 per 3,000 words, each item 2 or more sentences.

**Sentences** (apply these statistics only to texts of about 20 sentences or more; for a single paragraph they mean nothing):
- [ ] Median sentence length between 15 and 21 words.
- [ ] At least 1 in 10 sentences is 10 words or fewer.
- [ ] No five consecutive sentences within 6 words of each other in length.
- [ ] About 1 in 5 sentences opens with "We" or "Our" in method and results sections.
- [ ] Passive voice in fewer than 1 in 5 sentences, and only where the agent is obvious.
- [ ] Every "This" opener has an unambiguous antecedent in the previous sentence.

**Claims:**
- [ ] Every performance claim has a number, a named baseline, and a margin in the metric's units.
- [ ] Every result has its cost (time, hardware, data, or parameters) where the work has one to report.
- [ ] Every hedge is one word and sits next to its reason or evidence.
- [ ] Every "all" or "first" has its scope or exception stated.
- [ ] Negative and neutral results are reported in the same tone as positive ones.
- [ ] Every hyperparameter or setting value is stated once, with its symbol.

**Structure:**
- [ ] Abstract: 6 to 8 sentences following the roles in 3.1, unless the venue requires a structured abstract or a different length.
- [ ] Introduction ends with one sentence naming the proposal and one sentence with a number.
- [ ] Each section opener states scope in one sentence, or starts directly with content.
- [ ] No paragraph ends with a summary of itself.
- [ ] No transition paragraphs.
- [ ] Conclusion: what was presented, results restated, concrete future work, resource location. No "In conclusion".
- [ ] Headings are 1 to 5 word noun phrases.
- [ ] Every table caption states the finding as a sentence and defines its symbols and scope.

**Final read:**
- [ ] Read the text aloud. Any sentence that sounds like a pitch, a slogan, or a summary of a summary gets rewritten as a fact with a number or deleted.
- [ ] Do not introduce errors to seem human. Vary length and structure by content, not by design.
