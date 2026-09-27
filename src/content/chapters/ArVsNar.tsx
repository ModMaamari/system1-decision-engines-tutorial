import { Callout } from "../../components/ui/Callout";
import { KeyTakeaways, Lead, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { RaceSim } from "../../figures/RaceSim";

export default function ArVsNar() {
  return (
    <>
      <Lead>
        There are two ways to get a label out of a neural network. You can ask a generative model to{" "}
        <em>write</em> the label, one token at a time. Or you can list the possible labels and have a model{" "}
        <em>score</em> all of them at once. The first is autoregressive; the second is what a decision engine
        does. The difference shapes latency, cost, reliability and what the confidence numbers mean.
      </Lead>

      <h2>How an autoregressive model decides</h2>
      <p>
        A generative language model defines the probability of an output sequence as a product of next-token
        probabilities, each conditioned on everything before it:
      </p>
      <MathBlock label="autoregressive">{String.raw`p(y_1,\dots,y_T \mid x) \;=\; \prod_{t=1}^{T} p\!\left(y_t \mid y_{<t},\, x\right)`}</MathBlock>
      <p>
        To produce <M>{"y_t"}</M> it needs <M>{"y_{t-1}"}</M>, so generation is a loop: run the model, pick a
        token, append it, run again. A key-value cache makes each step cheaper than the first, but the steps are
        still sequential. For a decision, the loop writes something like{" "}
        <code>{'{"department": "billing"}'}</code>, and then your code has to parse it, check that{" "}
        <code>billing</code> is one of the allowed labels, and decide what to do when it is not.
      </p>

      <h2>How a decision engine decides</h2>
      <p>
        A decision engine never writes the label. The options <M>{"o_1,\\dots,o_k"}</M> are part of its input.
        One forward pass produces a score <M>{"s_i"}</M> for each option, in the context of the question{" "}
        <M>{"q"}</M>, the state <M>{"x"}</M> and the other options, and a softmax turns the scores into a
        distribution over exactly those options:
      </p>
      <MathBlock label="non-autoregressive">{String.raw`p(o_i \mid x, q) \;=\; \frac{\exp\!\big(s_i(x, q, o_{1..k}) / T\big)}{\sum_{j=1}^{k} \exp\!\big(s_j(x, q, o_{1..k}) / T\big)}`}</MathBlock>
      <p>
        <M>{"T"}</M> is a temperature fitted after training (chapter 10). Three properties follow directly from
        the formula:
      </p>
      <ul>
        <li>
          <strong>The answer is always valid.</strong> The argmax is one of the <M>{"k"}</M> options by
          construction. There is nothing to parse.
        </li>
        <li>
          <strong>Every option gets a probability.</strong> You see not only the winner but how close the
          runner-up was, which is what thresholds and escalation need.
        </li>
        <li>
          <strong>The cost does not depend on the answer.</strong> Scoring a three-letter label and a long one
          costs the same single pass (the options do take up room in the input, which chapter 5 covers).
        </li>
      </ul>

      <RaceSim />

      <h2>Reliability, side by side</h2>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Concern</th>
              <th scope="col">Generate the label</th>
              <th scope="col">Score the options</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Output format</th>
              <td>Must be parsed; can be malformed, wrapped in prose, or truncated</td>
              <td>A fixed structure: one probability per option</td>
            </tr>
            <tr>
              <th scope="row">Out-of-set answers</th>
              <td>Possible: a synonym, a new label, a different spelling</td>
              <td>Impossible: only listed options are scored</td>
            </tr>
            <tr>
              <th scope="row">Confidence</th>
              <td>
                Not given directly. Token log-probabilities exist but are spread over tokenisations; a confidence
                written in words is not a probability
              </td>
              <td>A normalised distribution, which can be calibrated with a temperature</td>
            </tr>
            <tr>
              <th scope="row">Repeatability</th>
              <td>Depends on sampling settings; with sampling, the same input can give different labels</td>
              <td>
                Deterministic for a given input, up to floating-point differences (Laya notes that changing batch
                shapes can move probabilities slightly)
              </td>
            </tr>
            <tr>
              <th scope="row">Latency and cost</th>
              <td>Grow with the number of output tokens</td>
              <td>One pass; several questions can share one batched call</td>
            </tr>
            <tr>
              <th scope="row">Expressiveness</th>
              <td>Anything text can express, including new answers and explanations</td>
              <td>Only the options you enumerated</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <Callout type="note" title="The middle ground">
        You can push a generative model towards scoring: constrain decoding to the allowed labels, or compare the
        log-likelihood the model assigns to each label. That removes invalid outputs, but you still run a large
        decoder (often once per label), multi-token labels complicate the comparison, and the probabilities were
        never trained to be calibrated for your decision. A decision engine is designed around the scoring view
        from the start: its training objective is about the distribution over options (chapters 8 and 9).
      </Callout>

      <h2>A family tree</h2>
      <p>
        “Non-autoregressive” first became a common term in machine translation, where Gu et al. (2018) generated
        every target token in parallel instead of left to right. Decision engines are non-autoregressive in a
        simpler sense: the output is one categorical choice per question, so there is no sequence to generate at
        all. Their closer ancestors are encoder classifiers: fine-tuned BERT models, cross-encoders that score a
        pair of texts, multiple-choice heads that score each candidate answer, and zero-shot classification by
        natural-language inference, which checks a label by asking whether the text entails “this text is
        about&nbsp;…” (Yin, Hay and Roth, 2019).
      </p>
      <p>
        What a System 1 engine like Laya adds to that lineage is a <strong>general request format</strong>:
        the question, its instructions and its options arrive with every request, three question types cover
        most decisions, and many questions are answered in one call. One model serves many decisions, and each
        decision can be improved by fine-tuning without changing the interface.
      </p>

      <h2>What you give up</h2>
      <ul>
        <li>
          <strong>You must know the options.</strong> An open question (“what is the customer's order number?”)
          is not a decision. Extraction and generation remain System 2 work.
        </li>
        <li>
          <strong>Many options strain the input.</strong> All options share a fixed token budget, and past about
          20 options Laya's accuracy drops sharply (Banking77: 0.425 on 77 labels, against 0.870 published for Jev on 72).
          Chapter 5 shows why, and chapter 12 shows the shortlist workaround.
        </li>
        <li>
          <strong>No thinking out loud.</strong> There is no chain of thought. If a decision needs several steps
          of reasoning, a single pass of an encoder may not be enough.
        </li>
      </ul>

      <KeyTakeaways
        items={[
          "Autoregressive models generate a label token by token; each token is a sequential forward pass, and the text must then be parsed.",
          "A decision engine scores every listed option in one pass and returns a normalised distribution over exactly those options.",
          "Scoring guarantees a valid answer and a probability per option; generating offers open-ended expressiveness.",
          "The trade: you must enumerate the options, keep their number modest, and accept that there is no step-by-step reasoning.",
        ]}
      />
    </>
  );
}
