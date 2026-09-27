import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { SequenceViz } from "../../figures/SequenceViz";

const LAYOUT = `[CLS]  choice question: Which department should handle this request?  [SEP]
[MASK] billing: invoices, payments, refunds
[MASK] technical: bugs, outages, system errors
[MASK] sales: pricing, new contracts
[MASK] other: everything else  [SEP]
{"from": "user@acme.com", "subject": "Duplicate charge on invoice #4411", "body": "Hi, we were billed twice ..."}  [SEP]`;

const WIDEN = `# widen the budgets for one call, without changing the agent for everyone else
result = agent.predict(state, questions, head_max_len=512, max_len=1024)

# or read a long document with the multilingual checkpoint's full window
result = router.predict(long_document, questions, model="multilingual", max_len=8192)

# or scan it in overlapping windows
result = agent.predict_long(state, questions, window=256)`;

export default function InputSequence() {
  return (
    <>
      <Lead>
        Before any maths happens, a decision engine has to turn “this question, these options, this input” into a
        single sequence of tokens. The layout decides what the model can see, and the token budgets decide what it
        cannot. Several of Laya's documented limits are budget effects, not model failures, so this chapter is
        worth reading closely.
      </Lead>

      <h2>One row per question</h2>
      <p>
        For every question in a request, Laya builds one row with this layout (from the docstring of{" "}
        <Source path="laya/common.py">build_sequence</Source>):
      </p>
      <CodeBlock lang="text" code={LAYOUT} title="one row (conceptual; the model sees token ids)" />
      <ul>
        <li>
          <strong>Header.</strong> <code>[CLS]</code>, then the question type and its instructions as text, then{" "}
          <code>[SEP]</code>. The type appears twice in the model: as words here, and as a learned type embedding
          (chapter 6).
        </li>
        <li>
          <strong>Options.</strong> Each option is its rendered text (chapter 4) preceded by a <code>[MASK]</code>{" "}
          token. The position of that <code>[MASK]</code> is recorded as the option's <em>marker</em>: the place
          where the model will later read a score for the option.
        </li>
        <li>
          <strong>State.</strong> A string is used as-is; a dict or list is serialised as JSON with non-ASCII
          characters kept, so field names like <code>subject</code> and <code>body</code> are visible to the model.
          Any literal mask token in user text is replaced by a space, so user input cannot plant a fake marker.
        </li>
      </ul>
      <p>
        Because the encoder is bidirectional, every token can attend to every other token in the row. The{" "}
        <code>[MASK]</code> in front of <code>billing</code> sees the option text, the question, the competing
        options and the state, all at once. That is what lets one pass score every option in context.
      </p>

      <h2>Two budgets</h2>
      <p>Each checkpoint's config sets two limits, both overridable per call:</p>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Checkpoint</th>
              <th scope="col" className="num">
                max_len
              </th>
              <th scope="col" className="num">
                head_max_len
              </th>
              <th scope="col" className="num">
                left for the state, about
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>laya (English)</td>
              <td className="num">512</td>
              <td className="num">192</td>
              <td className="num">320</td>
            </tr>
            <tr>
              <td>laya-multilingual</td>
              <td className="num">1,024 (encoder supports 8,192)</td>
              <td className="num">256</td>
              <td className="num">768</td>
            </tr>
            <tr>
              <td>laya-typed-decisions</td>
              <td className="num">1,024</td>
              <td className="num">256</td>
              <td className="num">768</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <p>
        <code>head_max_len</code> covers the header and all the options together; <code>max_len</code> covers the
        whole row. The rules, exactly as the code applies them:
      </p>
      <ol>
        <li>Each option is capped at 48 tokens (plus its marker).</li>
        <li>
          If the options leave fewer than 16 tokens of the head budget, <em>every</em> option is cut to the same
          length:
          <MathBlock>{String.raw`\text{per option} = \max\!\left(4,\; \left\lfloor \frac{\text{head\_max\_len} - 16}{n_{\text{options}}} \right\rfloor\right)\ \text{tokens, marker included}`}</MathBlock>
        </li>
        <li>The header gets what is left of the head budget, but never fewer than 8 tokens.</li>
        <li>
          The state fills the remaining room up to <code>max_len</code>. The rest of it is cut: from the end for a
          string or dict, from the <em>start</em> for a conversation list, so the newest turns survive.
        </li>
      </ol>

      <SequenceViz />

      <h2>Why 77 options fail: the Banking77 arithmetic</h2>
      <p>
        With the multilingual budget of 256 tokens and 77 options, rule 2 gives{" "}
        <M>{String.raw`\max(4, \lfloor 240 / 77 \rfloor) = \max(4, 3) = 4`}</M> tokens per option. One of them is the
        marker, so each label keeps about three tokens of text. Labels such as{" "}
        <code>card_payment_not_recognised</code> and <code>card_payment_fee_charged</code> start the same way, so
        after the cut some of them are literally the same tokens. Both base checkpoints score exactly 0.425 on
        Banking77, which the benchmark notes read as a budget ceiling, not a capability gap. Try the 77-label
        setting above and watch the “options still distinct” counter.
      </p>
      <Callout type="tip" title="Three ways around it">
        <ol>
          <li>
            <strong>Widen the head budget.</strong> On 58 MASSIVE intents, the README reports 24/58 correct at the
            default 192 and 34/58 at <code>head_max_len=384</code>, for about 1.4× the time on CPU. Widening further
            gave the accuracy back, because <code>max_len</code> then leaves less room for the state.
          </li>
          <li>
            <strong>Shortlist.</strong> <code>predict_shortlist</code> keeps the top-<M>{"k"}</M> labels by embedding
            similarity and runs one pass on those (chapter 12).
          </li>
          <li>
            <strong>Split the question.</strong> Ask a coarse question first (“card, transfer or top-up?”), then a
            fine one within the chosen group.
          </li>
        </ol>
      </Callout>

      <h2>Long inputs</h2>
      <p>
        By default a long state is simply cut, silently. Laya offers two remedies. <code>laya-multilingual</code>{" "}
        can read up to 8,192 tokens when you pass <code>max_len=8192</code>. The README reports 16 to 18 of 20
        requests answered correctly with up to about 4,000 tokens of text before the deciding content, and more
        variable results beyond (8 to 17 of 20), and notes that time follows the input's real length: short inputs
        are unaffected, and a 4,000-token input takes about 1.7 s on an Apple GPU.
      </p>
      <p>
        Or use <code>predict_long</code>, which splits the state into overlapping windows (50% overlap by
        default), scores them all in shared forward passes, and aggregates per question: <code>noul</code> takes
        the window with the highest P(true), while <code>choice</code> and <code>score</code> take the single most
        confident window, so one decisive paragraph is not out-voted by many neutral ones. Each answer reports
        which window decided it.
      </p>
      <CodeBlock code={WIDEN} title="Python · token budgets per call" />
      <Callout type="warning">
        A <code>predict_long</code> probability belongs to the deciding window, not to the whole document. The
        README points out that a maximum over many windows drifts upward with the number of windows even when
        nothing in the document supports the statement, so do not read it as a calibrated document-level number.
      </Callout>

      <KeyTakeaways
        items={[
          "Each question becomes one row: [CLS] header [SEP], then [MASK] + text for each option, [SEP], the state, [SEP].",
          "The [MASK] before each option is its marker: the position where the model reads that option's score.",
          "head_max_len holds the header and all options; overflowing options are all cut to max(4, (head_max_len − 16) // n) tokens.",
          "Past about 20 options, labels start to lose their distinguishing tokens; widen the budget, shortlist, or split the question.",
          "Long states are cut silently unless you raise max_len (multilingual: up to 8,192) or scan windows with predict_long.",
        ]}
      />
    </>
  );
}
