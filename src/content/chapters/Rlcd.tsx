import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, StatGrid, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { FINETUNE_SETTINGS as F } from "../../data/laya";
import { RlcdSim } from "../../figures/RlcdSim";

const LOOP = `# per micro-batch (from train_ddp.py in the fine-tuning notebook, abridged)
logits, act = model(input_ids, attention_mask, marker_pos, marker_mask, qtype)

# 1. G noisy logit vectors, noise projected to zero mean over the real options
eps = torch.randn((G,) + logits.shape) * sigma * mask
eps = (eps - eps.sum(-1, keepdim=True) / k) * mask
z = logits.detach().unsqueeze(0) + eps
q = torch.softmax(z.masked_fill(~mask, -1e4), -1)

# 2. proper-scoring reward and group-relative advantage
with torch.no_grad():
    r = proper_reward(q, target.unsqueeze(0), qtype, mask, w_sph=0.75, w_rps=1.0)
    adv = r - r.mean(0, keepdim=True)
    adv = adv / (adv.std() + 1e-6)

# 3. Gaussian-policy gradient plus soft cross-entropy
logp = -(((z - logits.unsqueeze(0)) ** 2) * mask).sum(-1) / (2 * sigma ** 2)
loss_rl = -(adv * logp).mean()
loss_ce = -(target * torch.log_softmax(logits.masked_fill(~mask, -1e4), -1)).sum(-1).mean()
loss = (loss_rl + 1.0 * loss_ce) / GRAD_ACCUM + 0.0 * act.sum()`;

const TD = `def td_lambda_targets(p_true, batch, lam=1.0):
    """TD(lambda) targets for multi-turn conversation trajectories."""
    ...
    y = batch["target"][idx[-1], 1]          # the episode's final outcome
    G = y
    for j in range(len(idx) - 1, -1, -1):    # walk the turns backwards
        if j < len(idx) - 1:
            G = (1 - lam) * p_true[idx[j + 1]] + lam * G
        target[idx[j], 0], target[idx[j], 1] = 1 - G, G`;

export default function Rlcd() {
  return (
    <>
      <Lead>
        RLCD stands for <strong>Reinforcement Learning for Calibrated Decisions</strong>. The idea is simple to
        state: treat the model's output distribution as an action, reward it with a strictly proper scoring rule, and
        improve it with a policy gradient. This chapter takes the recipe from Laya's public fine-tuning notebook apart,
        one line at a time, then lets you run it.
      </Lead>

      <h2>What the training data looks like</h2>
      <p>
        Each training item is a state, one question, and a <em>target distribution</em> over that question's options.
        In the typed-decisions benchmark the targets are a teacher model's probabilities (“gold distributions”), so a
        case can say “billing 0.55, technical 0.25, …” rather than just “billing”. The notebook turns 1,200 training
        cases into 6,000 items (five questions per case) with the same <code>build_sequence</code> used at inference,
        normalising each target to sum to 1.
      </p>

      <h2>The update, step by step</h2>
      <ol className="steps">
        <li>
          <strong>Forward pass.</strong> The model produces logits <M>{"z = f_\\theta(x)"}</M> for every row, as in
          chapter 6.
        </li>
        <li>
          <strong>Explore.</strong> Draw <M>{"G"}</M> noise vectors <M>{"\\varepsilon_g \\sim \\mathcal{N}(0, \\sigma^2 I)"}</M>,
          subtract each one's mean over the options, and form <M>{"\\tilde z_g = z + \\varepsilon_g"}</M>. The notebook
          uses <M>{`G = ${F.groupSize}`}</M> and anneals <M>{"\\sigma"}</M> from {F.sigmaStart} to {F.sigmaEnd} over the
          epochs.
        </li>
        <li>
          <strong>Score.</strong> Each sample becomes a distribution <M>{"q_g = \\mathrm{softmax}(\\tilde z_g)"}</M>,
          rewarded with the proper reward of chapter 8: <M>{"r_g = R(q_g, t)"}</M>.
        </li>
        <li>
          <strong>Baseline.</strong> Compare each sample with its own group:
          <MathBlock>{String.raw`A_g = \frac{r_g - \bar r}{\operatorname{std}(r) + 10^{-6}}`}</MathBlock>
          This group-relative advantage is the idea behind GRPO (Shao et al., 2024): no value network, just “better or
          worse than the other tries”.
        </li>
        <li>
          <strong>Policy gradient.</strong> The samples come from a Gaussian policy centred on <M>{"z"}</M>, whose
          log-density is{" "}
          <M>{String.raw`\log \pi(\tilde z_g) = -\lVert \tilde z_g - z\rVert^2 / 2\sigma^2 + \text{const}`}</M>, so
          <MathBlock>{String.raw`\nabla_z\!\left[-\tfrac{1}{G}\sum_g A_g \log \pi(\tilde z_g)\right] \;=\; -\frac{1}{G}\sum_g A_g\,\frac{\varepsilon_g}{\sigma^2}`}</MathBlock>
          In words: move the logits towards the noise directions that earned above-average reward, and away from the
          others.
        </li>
        <li>
          <strong>Soft cross-entropy.</strong> Add{" "}
          <M>{String.raw`\mathrm{CE}\big(t, \mathrm{softmax}(z)\big) = -\sum_i t_i \log \mathrm{softmax}(z)_i`}</M> at
          full weight, whose gradient is simply <M>{String.raw`\mathrm{softmax}(z) - t`}</M>. Then backpropagate the sum
          through the head and the encoder.
        </li>
      </ol>
      <CodeBlock code={LOOP} title="Python · the notebook's training step (abridged)" highlight={[5, 12, 13, 18, 19]} />

      <Callout type="note" title="Why project the noise to zero mean?">
        A softmax does not change when the same constant is added to every logit. Noise along that direction would
        change nothing about <M>{"q"}</M> and earn no reward difference, so it would only add variance. Removing each
        sample's mean keeps the exploration in the directions that matter.
      </Callout>

      <RlcdSim />

      <h2>Why a policy gradient and a cross-entropy?</h2>
      <p>
        With a soft target, the cross-entropy term and the log-score part of the reward have the same optimum:{" "}
        <M>{"q = t"}</M>. The cross-entropy is a direct, low-variance pull towards it. The policy-gradient term
        optimises the whole composite reward, including the parts cross-entropy does not express: the bounded
        spherical score and, for score questions, the ranked probability penalty that rewards near misses. The notebook
        simply uses both, describing the cross-entropy as “full 1.0 soft cross-entropy guidance”.
      </p>
      <p>
        The simulator also shows what the choice of reward buys. A proper reward, alone or with cross-entropy, lands on
        the teacher's distribution. An improper linear reward pushes the answer to certainty and overpowers the
        cross-entropy term. A 0/1 accuracy reward stops teaching anything once the sampled groups agree on the argmax.
      </p>

      <h2>From the toy to a real run</h2>
      <p>
        The real run applies the same step to batches of token sequences, and the gradient flows into all of the
        encoder's and head's parameters. The settings the notebook uses on Kaggle's two free T4 GPUs:
      </p>
      <TableWrap caption="From docs/finetune.md and the notebook's train_ddp.py.">
        <table>
          <tbody>
            <tr>
              <th scope="row">Epochs</th>
              <td>{F.epochs}</td>
            </tr>
            <tr>
              <th scope="row">Effective batch</th>
              <td>
                {F.effectiveBatch} sequences ({F.microBatch} per micro-batch × {F.gpus} GPUs × {F.gradAccum} accumulation
                steps)
              </td>
            </tr>
            <tr>
              <th scope="row">Optimiser</th>
              <td>
                AdamW, weight decay 0.01, cosine schedule; encoder learning rate {F.lrEncoder}, head {F.lrHead}
              </td>
            </tr>
            <tr>
              <th scope="row">Exploration</th>
              <td>
                G = {F.groupSize} samples per item, σ annealed {F.sigmaStart} → {F.sigmaEnd}
              </td>
            </tr>
            <tr>
              <th scope="row">Reward</th>
              <td>
                proper_reward with w_sph = {F.wSph}, w_rps = {F.wRps}; soft cross-entropy weight {F.ceWeight}
              </td>
            </tr>
            <tr>
              <th scope="row">Memory</th>
              <td>fp16 autocast, gradient checkpointing on encoder and head, gradient-norm clip 1.0</td>
            </tr>
            <tr>
              <th scope="row">Sequence budget</th>
              <td>
                max_len {F.maxLen}, head_max_len {F.headMaxLen}, at most 4,096 tokens per batch
              </td>
            </tr>
            <tr>
              <th scope="row">Calibration slice</th>
              <td>{F.calibrationSlice}</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <p>
        The notebook's demo (6,000 decisions) trains in about 4–6 minutes; the docs estimate 4–5 hours for four
        epochs over about 30,000 questions. After the last epoch it fits one temperature per question type on the
        held-out calibration slice (chapter 10), evaluates on the test split, and can push the result to the Hugging
        Face Hub. The act head receives no gradient in this recipe: the loss includes it only as{" "}
        <code>0.0 * act.sum()</code>.
      </p>

      <StatGrid
        items={[
          { value: "0.362", label: "base laya, typed-decisions", note: "zero-shot; random 0.318, majority 0.461", tone: "neutral" },
          { value: "0.766", label: "after fine-tuning", note: "laya-typed-decisions, 2,000 test decisions" },
          { value: "0.735", label: "teacher self-agreement", note: "the fine-tuned model is above it", tone: "noul" },
          { value: "0.10 → 0.66", label: "browser agent, element top-1", note: "among ~45 candidates, 421M model", tone: "choice" },
        ]}
      />

      <h2>Multi-turn decisions: TD(λ) targets</h2>
      <p>
        Some decisions are made at every turn of a conversation, but the truth only arrives at the end (did the
        customer convert? did they churn?). Laya's <Source path="laya/common.py">td_lambda_targets</Source> builds
        the binary target for each turn by walking the episode backwards from the final outcome, blending in the
        model's own prediction for the next turn:
      </p>
      <MathBlock>{String.raw`G_{T} = y, \qquad G_j = (1 - \lambda)\, \hat p_{j+1} + \lambda\, G_{j+1}, \qquad t_j = (1 - G_j,\; G_j)`}</MathBlock>
      <CodeBlock code={TD} title="Python · laya/common.py (abridged)" />
      <p>
        With <M>{"\\lambda = 1"}</M>, as the article introducing Laya describes, every turn is trained directly
        against the real final outcome (a Monte Carlo target); smaller <M>{"\\lambda"}</M> bootstraps from the model's
        own next-turn estimate.
      </p>

      <Callout type="tip" title="Before you fine-tune (from docs/finetune.md)">
        <ul>
          <li>
            <strong>The targets are the ceiling.</strong> RLCD imitates the teacher's distribution; collect good teacher
            confidences first.
          </li>
          <li>
            <strong>Keep your own held-out evaluation set.</strong> The calibration slice is sized for three
            temperatures, not for validation.
          </li>
          <li>
            <strong>Shape each decision into a primitive</strong> (choice, score or noul) before collecting data.
          </li>
          <li>
            <strong>Ship the config, not just the weights.</strong> An inherited <code>temperature_by_options</code>{" "}
            silently overrides a new per-type fit; the notebook deletes it.
          </li>
        </ul>
      </Callout>

      <KeyTakeaways
        items={[
          "RLCD samples noisy logits around the model's output, scores each sample with a proper reward, and uses group-relative advantages as the baseline.",
          "The gradient is −(1/G) Σ A_g ε_g / σ² on the logits, plus softmax(z) − t from the soft cross-entropy term.",
          "With a proper reward the model learns the teacher's whole distribution; improper rewards produce overconfidence or no learning signal.",
          "The public recipe: 4 epochs, G = 4, σ 0.4 → 0.1, w_sph = 0.75, AdamW with 2.5e-5 (encoder) and 1e-4 (head), then temperature fitting on a held-out slice.",
          "Fine-tuning is where Laya's accuracy comes from: 0.362 → 0.766 on typed-decisions.",
        ]}
      />
    </>
  );
}
