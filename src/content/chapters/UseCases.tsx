import { Callout } from "../../components/ui/Callout";
import { KeyTakeaways, Lead, TableWrap } from "../../components/ui/Blocks";
import { DesignWizard } from "../../figures/DesignWizard";
import { UseCaseGallery } from "../../figures/UseCaseGallery";

export default function UseCases() {
  return (
    <>
      <Lead>
        The hardest part of using a decision engine is not the API; it is turning a messy business decision into
        questions a model can answer well. This chapter gives you a method, a set of worked schemas from real domains
        with the evidence for each, and the anti-patterns to design around.
      </Lead>

      <h2>A method for designing decisions</h2>
      <ol>
        <li>
          <strong>Start from the action.</strong> Write down what your system does differently for each answer. If two
          answers lead to the same action, merge them; if no action depends on the question, drop it.
        </li>
        <li>
          <strong>Pick the primitive.</strong> One answer from categories: <code>choice</code>. An ordered scale:{" "}
          <code>score</code>. A yes/no property: <code>noul</code>. Several independent properties: several{" "}
          <code>noul</code> questions, not one choice with combined labels.
        </li>
        <li>
          <strong>Write options the model can match.</strong> Descriptions do the work; labels should be semantic or
          opaque; give “other” an explicit option so the model is not forced into a wrong category.
        </li>
        <li>
          <strong>Keep it small.</strong> About 20 options or fewer per choice; split into a coarse and a fine question,
          or shortlist, when you need more.
        </li>
        <li>
          <strong>Point at the field.</strong> Laya's presets name the state field they read in backticks (“in{" "}
          <code>`message`</code>”); put the text under that key.
        </li>
        <li>
          <strong>Decide the policy.</strong> For each question: the threshold, what happens below it, and whether the
          action is reversible.
        </li>
        <li>
          <strong>Measure, then specialise.</strong> Evaluate zero-shot on labelled data from your own traffic, fine-tune
          on your decisions if it falls short (it usually does), and fit temperatures on held-out data.
        </li>
      </ol>

      <DesignWizard />

      <h2>Worked schemas, with the evidence</h2>
      <UseCaseGallery />

      <h2>Anti-patterns</h2>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Anti-pattern</th>
              <th scope="col">Why it fails</th>
              <th scope="col">Do instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Choice labels <code>yes</code>/<code>no</code>, <code>true</code>/<code>false</code>
              </td>
              <td>Current checkpoints can follow the label word instead of its description</td>
              <td>
                A <code>noul</code> with criteria, or semantic / opaque labels
              </td>
            </tr>
            <tr>
              <td>
                Combined categories (<code>billing_urgent</code>)
              </td>
              <td>Options multiply; each combination gets little data</td>
              <td>One question per property, answered in the same call</td>
            </tr>
            <tr>
              <td>No “other” option</td>
              <td>The model must pick one of your labels, so out-of-scope inputs get a confident wrong answer</td>
              <td>Add an explicit catch-all and route it to review</td>
            </tr>
            <tr>
              <td>50+ options in one question</td>
              <td>Options are cut to a few tokens each and collapse</td>
              <td>Shortlist, split, or widen head_max_len and measure</td>
            </tr>
            <tr>
              <td>Untested negation</td>
              <td>In a documented test, negated cancellation requests were classified as cancel_account, one at probability 0.9998</td>
              <td>Add negated phrasings to your evaluation set</td>
            </tr>
            <tr>
              <td>
                <code>noul</code> without criteria on the English checkpoint
              </td>
              <td>The generic wording can decide the answer by itself</td>
              <td>Describe the true and false cases</td>
            </tr>
            <tr>
              <td>
                Gating on <code>confidence</code> or <code>act_probability</code>
              </td>
              <td>The first is not calibrated; the second carries no signal yet</td>
              <td>
                Gate on <code>answer_confidence</code>
              </td>
            </tr>
            <tr>
              <td>Extraction dressed as a decision (“what is the order number?”)</td>
              <td>There is no fixed option set</td>
              <td>Use an extractor or a generative model</td>
            </tr>
            <tr>
              <td>Expecting zero-shot accuracy on a specialised workflow</td>
              <td>Base checkpoints score 0.36 on typed-decisions (random 0.32)</td>
              <td>Fine-tune: the same benchmark reaches 0.766</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <Callout type="tip" title="When a decision engine is the wrong tool">
        If the options change on every request and there are hundreds of them, if the answer needs multi-step reasoning
        over facts that are not in the input, or if every decision is rare and high-stakes enough to justify a slow,
        careful model and a human, a System 1 engine is not the right fit, or should only pre-sort the work.
      </Callout>

      <KeyTakeaways
        items={[
          "Design from the action backwards: every answer must change what the system does.",
          "choice for categories, score for ordered scales, noul for yes/no properties; several independent properties become several noul questions.",
          "Describe every option, include “other”, avoid boolean-word labels, and keep option sets small.",
          "Published evidence varies widely by domain: email security is strong as shipped, moderation is weak, specialised workflows need fine-tuning.",
        ]}
      />
    </>
  );
}
