import { Callout } from "../../components/ui/Callout";
import { KeyTakeaways, Lead, TableWrap } from "../../components/ui/Blocks";
import { SystemSorter } from "../../figures/SystemSorter";

export default function FastAndSlow() {
  return (
    <>
      <Lead>
        In <em>Thinking, Fast and Slow</em> (2011), the psychologist Daniel Kahneman describes the mind as two
        cooperating modes. <strong>System 1</strong> is fast, automatic and effortless: recognising a face,
        reading a word, sensing that a sentence is hostile. <strong>System 2</strong> is slow, effortful and
        deliberate: long multiplication, checking an argument, planning a route through an unfamiliar city.
        Decision engines take their name from the first.
      </Lead>

      <h2>The two systems, briefly</h2>
      <p>
        The labels were introduced by the psychologists Keith Stanovich and Richard West, and popularised by
        Kahneman. Kahneman is explicit that the two systems are a useful fiction for describing behaviour, not
        two separate parts of the brain. The fiction is useful because of how the systems divide the work:
      </p>
      <ul>
        <li>
          <strong>System 1 runs all the time.</strong> It produces impressions and judgements continuously, at
          little cost, and most of the time they are good enough to act on.
        </li>
        <li>
          <strong>System 2 is engaged when System 1 struggles.</strong> Surprise, difficulty or high stakes
          recruit slow, careful thought, which is expensive and limited.
        </li>
        <li>
          <strong>System 1 has systematic biases.</strong> Its speed comes from shortcuts, and those shortcuts
          fail in predictable ways.
        </li>
      </ul>
      <p>All three points carry over to software, including the third.</p>

      <h2>The same split in software</h2>
      <p>
        Large language models made System 2 behaviour cheap enough to use everywhere: planning, writing, tool
        use, step-by-step reasoning. But most of the decisions a production system makes are still System 1
        decisions. They have a known set of possible answers, they happen on every request, and they need to be
        fast and consistent more than they need to be creative.
      </p>

      <TableWrap caption="Latency figures are Laya's measured single-question numbers on a Tesla T4; generative latency depends on the model and on how many tokens it writes.">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Aspect</span>
              </th>
              <th scope="col">System 1: decision engine</th>
              <th scope="col">System 2: generative model</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Output</th>
              <td>A probability for each option you listed</td>
              <td>Free text: answers, plans, code, explanations</td>
            </tr>
            <tr>
              <th scope="row">Work per decision</th>
              <td>One forward pass, whatever the number of options</td>
              <td>One forward pass per generated token, plus any reasoning tokens</td>
            </tr>
            <tr>
              <th scope="row">Latency</th>
              <td>Tens of milliseconds on a GPU (32.8–39.5 ms for Laya)</td>
              <td>Grows with the length of the output</td>
            </tr>
            <tr>
              <th scope="row">Typical failure</th>
              <td>Confidently wrong within the option set; cannot say “none of these” unless that is an option</td>
              <td>Malformed output, labels that were never offered, confidence stated in words rather than measured</td>
            </tr>
            <tr>
              <th scope="row">Where skill comes from</th>
              <td>Training and fine-tuning on decisions like yours</td>
              <td>Broad pre-training, prompting and examples</td>
            </tr>
            <tr>
              <th scope="row">Best at</th>
              <td>High-volume, low-latency decisions with known options</td>
              <td>Novel, ambiguous or multi-step problems</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <h2>Division of labour: gate, then escalate</h2>
      <p>
        The pattern that falls out of this is the one Kahneman describes for people. Let the fast system handle
        every request, and let it decide when the slow system is needed. In software that means a decision engine
        answers first, and its <em>calibrated confidence</em> decides whether to act on the answer, hand the case
        to a larger model, or ask a human. Chapters 10 and 13 cover how to make that confidence trustworthy and
        how to pick the threshold.
      </p>

      <SystemSorter />

      <Callout type="warning" title="Where the analogy breaks">
        <p>
          The analogy is about <em>role and cost</em>, not about mechanism. A decision engine is not intuitive; it
          is an encoder with a scoring head, trained on examples. And like human System 1, it has systematic
          biases that you have to measure. Laya documents several of its own: the multilingual checkpoint rarely
          picks the first level of a <code>score</code> question, a <code>noul</code> answer on the English
          checkpoint can follow its option labels instead of the input, and the English checkpoint stays confident
          on scripts it cannot read. Chapter 16 collects these limits.
        </p>
      </Callout>

      <h2>Decisions you already make this way</h2>
      <p>
        If you have ever written a keyword rule, a regular expression filter, or a fine-tuned BERT classifier,
        you have built a System 1 component. What a decision engine adds is <strong>flexibility at request
        time</strong>: the question, its instructions and its options are part of the input, so one model can
        answer questions it was never given a dedicated head for, and you can add a new decision without training
        a new classifier (though fine-tuning still helps a great deal, as chapter 9 shows).
      </p>

      <KeyTakeaways
        items={[
          "Kahneman's System 1 is fast, automatic and cheap; System 2 is slow, deliberate and expensive, and is engaged when System 1 struggles.",
          "Most decisions in production software have a known set of answers and happen on every request: System 1 territory.",
          "The robust architecture is a cascade: a decision engine answers first, and its calibrated confidence decides when to escalate.",
          "The analogy is about role and cost. Decision engines have systematic biases that must be measured, like human intuition.",
        ]}
      />
    </>
  );
}
