import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, TableWrap, TypeTag } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { QuestionBuilder } from "../../figures/QuestionBuilder";

const CHOICE = `"department": {
    "type": "choice",
    "instructions": "Which department should handle this request?",
    "criteria": {
        "billing": "invoices, payments, refunds",
        "technical": "bugs, outages, system errors",
        "sales": "pricing, new contracts",
        "other": "everything else"
    }
}
# answer
{"type": "choice", "choice": "billing",
 "probabilities": {"billing": ..., "technical": ..., "sales": ..., "other": ...},
 "confidence": ..., "answer_confidence": ...}`;

const SCORE = `"urgency": {
    "type": "score",
    "instructions": "How urgent is this request?",
    "criteria": ["not urgent", "soon", "critical deadline or blocking issue"]
}
# answer
{"type": "score", "score": 1.84,          # expected level, a real number in [0, 2]
 "legend": {"0": "not urgent", "1": "soon", "2": "critical deadline or blocking issue"},
 "probabilities": {"0": ..., "1": ..., "2": ...},
 "confidence": ..., "answer_confidence": ...}`;

const NOUL = `"refund_requested": {
    "type": "noul",
    "instructions": "Does the user explicitly request a refund?",
    "criteria": {"true": "the user asks for money back",      # optional
                 "false": "no refund is requested"},
    "labels": {"true": "A", "false": "B"}                      # optional, model-facing words only
}
# answer
{"type": "noul", "noul": 0.892,           # P(true)
 "confidence": 0.892, "answer_confidence": 0.892}`;

const SCHEMA = `schema = {
    "type": "object",
    "properties": {
        "department": {"type": "string", "enum": ["billing", "support", "sales"],
                       "description": "Which team should handle this?"},   # -> choice
        "urgency": {"type": "integer", "minimum": 0, "maximum": 2},        # -> score
        "needs_human": {"type": "boolean"},                                # -> noul
    },
}
agent.decide("I was charged twice, refund me.", schema=schema)
# {"department": "billing", "urgency": 2, "needs_human": True}`;

export default function Primitives() {
  return (
    <>
      <Lead>
        A decision engine is only as useful as the questions you can ask it. Laya, like the Jev API whose request
        format it shares, expresses every decision with three question types. Learning to cast a real decision
        into them is most of the skill of using a System 1 engine.
      </Lead>

      <TableWrap caption="From the README's “Decision Primitives” table.">
        <table>
          <thead>
            <tr>
              <th scope="col">Primitive</th>
              <th scope="col">You provide</th>
              <th scope="col">You get</th>
              <th scope="col">Typical uses</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <TypeTag type="choice" />
              </td>
              <td>Labels, ideally each with a description</td>
              <td>The top label and a probability per label</td>
              <td>Department routing, intent, topic</td>
            </tr>
            <tr>
              <td>
                <TypeTag type="score" />
              </td>
              <td>Ordered levels, level 0 first, each described</td>
              <td>The expected level, and a probability per level</td>
              <td>Urgency, frustration, harm severity</td>
            </tr>
            <tr>
              <td>
                <TypeTag type="noul" />
              </td>
              <td>A yes/no statement, optionally describing each side</td>
              <td>P(true), from 0 to 1</td>
              <td>Phishing, spam, jailbreak, churn risk</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <p>
        Every question also carries <code>instructions</code>: plain-language text that tells the model what to
        decide. The question id (the dictionary key, such as <code>department</code>) is just a name for the
        answer; the model reads the instructions and the options.
      </p>

      <h2>
        <TypeTag type="choice" /> pick one of several labels
      </h2>
      <CodeBlock code={CHOICE} title="choice question and answer" />
      <p>
        <code>criteria</code> is either a dictionary from label to description or a plain list of labels. The model
        reads each option as <code>label: description</code>, so <strong>the description is doing real work</strong>:
        it is the text the option is matched against. Labels are also the answer keys, so they must be unique. The
        answer is the label with the highest probability, and <code>probabilities</code> holds the whole
        distribution.
      </p>
      <Callout type="warning" title="Two documented pitfalls">
        <p>
          <strong>Boolean-word labels.</strong> Laya's README warns that choice keys are rendered verbatim and the
          current checkpoints “can follow labels such as <code>true</code>/<code>false</code> or{" "}
          <code>yes</code>/<code>no</code> instead of the option descriptions”. Use semantic labels (
          <code>refund</code>, <code>no_refund</code>) or opaque ones (<code>A</code>, <code>B</code>).
        </p>
        <p>
          <strong>Negation.</strong> Semantic labels do not make negation safe: in a small set of cancellation
          examples, negated requests (“I do <em>not</em> want to cancel”) were still classified as{" "}
          <code>cancel_account</code>, once with probability 0.9998. Test the exact wording you serve.
        </p>
      </Callout>

      <h2>
        <TypeTag type="score" /> place the state on an ordered scale
      </h2>
      <CodeBlock code={SCORE} title="score question and answer" />
      <p>
        Levels are listed from level 0 upwards and every level needs a description (a missing one is rejected).
        The model assigns a probability to each level, and the <code>score</code> field is the{" "}
        <strong>expected level</strong>, not the most likely one:
      </p>
      <MathBlock>{String.raw`\text{score} \;=\; \sum_{i=0}^{k-1} i \cdot p_i`}</MathBlock>
      <p>
        So a score of 1.84 on a 0–2 scale means most of the probability sits on level 2 with some on level 1. If
        you need a single level, take the argmax of <code>probabilities</code> (that is what Laya's schema-driven{" "}
        <code>decide</code> does) or round the expectation, and say which you chose.
      </p>
      <Callout type="note">
        <code>score</code> is the weakest of the three primitives in Laya's published numbers (SST-5, five
        sentiment levels: 0.372), and <code>laya-multilingual</code> has a documented position bias: it rarely
        picks the first-listed level, in any language. For English score questions, route to the English
        checkpoint.
      </Callout>

      <h2>
        <TypeTag type="noul" /> the probability that a statement is true
      </h2>
      <CodeBlock code={NOUL} title="noul question and answer" />
      <p>
        A <code>noul</code> question always scores two slots in the order <code>[false, true]</code> and returns
        the probability of the second: <M>{"P(\\text{true})"}</M>. For a noul, <code>confidence</code> and{" "}
        <code>answer_confidence</code> are the same number, <M>{"\\max(p, 1-p)"}</M>.
      </p>
      <ul>
        <li>
          <code>criteria</code> is optional and may only use the keys <code>true</code> and <code>false</code>:
          those two descriptions <em>are</em> the option texts. Any other key (say <code>yes</code>) is rejected,
          because it used to be silently dropped.
        </li>
        <li>
          Without criteria, the model reads a generic pair: “no, the statement does not hold” and “yes, the
          statement holds”. On the English checkpoint that pair can decide the answer by itself, so give criteria
          when you need the question to discriminate.
        </li>
        <li>
          <code>labels</code> changes only the words the model sees in front of each slot (by default{" "}
          <code>false</code> and <code>true</code>); the answer is still P(true). It exists because the English
          checkpoint can follow the <code>false:</code>/<code>true:</code> words instead of the state.
        </li>
      </ul>

      <QuestionBuilder />

      <h2>Many questions, one call</h2>
      <p>
        A request carries a dictionary of questions. Laya turns each question into its own input row (the same
        state, a different question and set of options) and runs all rows through the model together, so asking
        five questions is one batched forward call rather than five round trips. The answers come back keyed by
        question id, together with a <code>usage</code> block that counts input tokens (output tokens are always
        0: nothing is generated).
      </p>

      <h2>From a schema instead of questions</h2>
      <p>
        If you already describe your output with a JSON schema or a pydantic model, Laya can derive the questions:
        a string <code>enum</code> becomes a choice, a <code>boolean</code> becomes a noul, and an integer with a
        minimum and maximum (at most 10 levels) becomes a score. Free strings, arrays and nested objects are
        rejected, because they are not fixed option sets. <Source path="laya/structured.py" />
      </p>
      <CodeBlock code={SCHEMA} title="Python · schema-driven decide" />
      <p>
        The projection back onto the schema is deliberately simple: an enum field takes the chosen label, an
        integer takes the most probable level, and a boolean is <code>true</code> when P(true) ≥ 0.5.
      </p>

      <KeyTakeaways
        items={[
          <>
            <TypeTag type="choice" /> picks a label; the descriptions are what the model matches against, so write
            them carefully and avoid yes/no-style labels.
          </>,
          <>
            <TypeTag type="score" /> returns the expected level Σ i·pᵢ, a real number; take the argmax of the
            probabilities if you need a level.
          </>,
          <>
            <TypeTag type="noul" /> returns P(true) over the slots [false, true]; describe both sides with criteria
            keyed exactly <code>true</code>/<code>false</code>.
          </>,
          "Several questions about one state are answered in one batched call, one row per question.",
        ]}
      />
    </>
  );
}
