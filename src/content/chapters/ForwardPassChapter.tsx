import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { ForwardPass } from "../../figures/ForwardPass";
import { decisionSideParams, fmtParams } from "../../lib/params";

const FORWARD = `def forward(self, input_ids, attention_mask, marker_pos, marker_mask, qtype):
    h = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
    h = h + self.type_emb(qtype)[:, None, :]                 # which primitive is this row?
    pad = ~attention_mask.bool()
    for layer in self.head.layers:                           # the decision head
        h = layer(h, src_key_padding_mask=pad)
    idx = marker_pos.clamp(min=0)[:, :, None].expand(-1, -1, h.size(-1))
    m = torch.gather(h, 1, idx)                              # one vector per option
    logits = self.scorer(m).squeeze(-1).float()              # one number per option
    logits = logits.masked_fill(~marker_mask, -1e4)          # padding slots -> ~0 probability
    # act head: pooled [CLS] + 4 features of softmax(logits)  (see below)
    return logits, act_logits`;

const large = decisionSideParams(1024);
const base = decisionSideParams(768);

export default function ForwardPassChapter() {
  return (
    <>
      <Lead>
        The whole model is an encoder you may already know, plus a small head that turns “a vector for each
        option” into “a probability for each option”. This chapter follows one batch through Laya's{" "}
        <Source path="laya/common.py">DecisionModel</Source>, stage by stage, with the real tensor shapes.
      </Lead>

      <ForwardPass />

      <h2>The code, abridged</h2>
      <p>
        Here is <code>DecisionModel.forward</code> with gradient checkpointing and the single-option edge case
        removed. It is short enough to read in full:
      </p>
      <CodeBlock code={FORWARD} title="Python · laya/common.py (abridged)" highlight={[3, 8, 9]} />

      <h2>Why score at the [MASK] positions?</h2>
      <p>
        A plain classifier reads one pooled vector and has a fixed output layer with one unit per class, so its
        label set is frozen at training time. Here, the options are <em>input</em>, and each one gets its own
        position in the sequence. Scoring the hidden state at that position with a shared MLP means:
      </p>
      <ul>
        <li>
          <strong>Any number of options, any labels.</strong> The same weights score 2 options or 20, and labels the
          model has never seen, because an option is described by its text, not by an output unit.
        </li>
        <li>
          <strong>Options are judged in context.</strong> Attention lets each option's marker compare itself with the
          state and with the other options before it is scored.
        </li>
        <li>
          <strong>Order can still leak in.</strong> Options have positions, so the model can learn position
          preferences. Laya measured how often answers change when options are shuffled: 0.150 on 20-option MASSIVE
          intent for the English checkpoint, against 0.13 measured for Jev, and it notes this is worth fixing with more
          option-order shuffling in training.
        </li>
      </ul>
      <p>With marker vectors <M>{"m_i"}</M>, the logit of option <M>{"i"}</M> is:</p>
      <MathBlock>{String.raw`z_i \;=\; W_2\,\mathrm{GELU}\!\big(W_1\,\mathrm{LN}(m_i) + b_1\big) + b_2, \qquad z_i \in \mathbb{R}`}</MathBlock>

      <h2>Where the parameters are</h2>
      <p>
        Almost all of the model is the pretrained encoder. The decision side is small; its size follows from the
        layer definitions (a head layer has <M>{"12d^2 + 13d"}</M> parameters):
      </p>
      <TableWrap caption="Decision-side sizes computed from the layer definitions in laya/common.py, assuming 2 head layers and a 2-way act head. The encoder column is the published total minus the decision side.">
        <table>
          <thead>
            <tr>
              <th scope="col">Checkpoint</th>
              <th scope="col" className="num">
                hidden d
              </th>
              <th scope="col" className="num">
                decision head
              </th>
              <th scope="col" className="num">
                scorer + act + type
              </th>
              <th scope="col" className="num">
                encoder (≈)
              </th>
              <th scope="col" className="num">
                published total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>laya, laya-typed-decisions (ModernBERT-large)</td>
              <td className="num">1,024</td>
              <td className="num">{fmtParams(large.head)}</td>
              <td className="num">{fmtParams(large.scorer + large.act + large.typeEmb)}</td>
              <td className="num">{fmtParams(421e6 - large.total)}</td>
              <td className="num">421M</td>
            </tr>
            <tr>
              <td>laya-multilingual (mmBERT-base)</td>
              <td className="num">768</td>
              <td className="num">{fmtParams(base.head)}</td>
              <td className="num">{fmtParams(base.scorer + base.act + base.typeEmb)}</td>
              <td className="num">{fmtParams(322e6 - base.total)}</td>
              <td className="num">322M</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <p>
        The multilingual checkpoint has a 256k-token vocabulary (its <code>tokenizer.json</code> alone is 34 MB, per
        the README). At width 768, that embedding table is about 197M parameters, most of the encoder. The layers
        themselves are fewer and narrower than ModernBERT-large's (22 of width 768, against 28 of width 1,024), which
        fits with the multilingual checkpoint being roughly twice as fast.
      </p>

      <Callout type="laya" title="Precision and speed paths">
        <p>
          On CUDA, Laya runs the forward pass under autocast in the checkpoint's dtype (bf16 for the shipped
          checkpoints on newer GPUs; <code>LAYA_CUDA_AMP=fp16</code> switches to fp16, which stays closer to fp32).
          An optional <code>fast=True</code> path replaces the forward with fused TileLang kernels and CUDA graphs; on a
          fixed test set its probabilities stay within 0.05 of an fp32 forward. There is also an ONNX export and a
          TypeScript runtime for Node and the browser. The model is the same in every case.
        </p>
      </Callout>

      <h2>One pass, several questions</h2>
      <p>
        Because each question is a row, a request with five questions is a batch of five rows and still one call.
        That is why, on a T4, the multilingual checkpoint answers 1 question in 32.8 ms but 10 questions in 72.3 ms,
        about 7.2 ms each. On a CPU the rows are not processed in parallel the same way: on a 4-core server Laya
        measured roughly linear cost per question, so batching saves little there.
      </p>

      <KeyTakeaways
        items={[
          "Encoder → + type embedding → 2-layer decision head → gather the [MASK] vectors → shared scorer MLP → one logit per option.",
          "Options are inputs, not output units: the same weights score any number of options with any labels.",
          "Padding slots are masked with −1e4 so the softmax ignores them; each row's real options are decoded separately.",
          "Nearly all parameters are the pretrained encoder; the decision side is about 25M (d = 1024) or 14M (d = 768) for the head.",
          "The act head's act_probability is not usable yet (AUROC 0.30); gate on confidence.",
        ]}
      />
    </>
  );
}
