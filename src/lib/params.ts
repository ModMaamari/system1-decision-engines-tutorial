/**
 * Parameter counts of the decision-side modules in `DecisionModel` (laya/common.py), computed from
 * their layer definitions for a hidden size d:
 *   head:     head_layers x TransformerEncoderLayer(d, nhead=d/64, dim_ff=4d, norm_first)
 *   type_emb: Embedding(3, d)
 *   scorer:   LayerNorm(d) -> Linear(d, d) -> GELU -> Linear(d, 1)
 *   act_head: Linear(d + 4, 256) -> GELU -> Linear(256, n_act)
 */
export function encoderLayerParams(d: number): number {
  const attn = 3 * d * d + 3 * d + d * d + d; // in_proj (q,k,v) + out_proj
  const ffn = 4 * d * d + 4 * d + 4 * d * d + d; // linear1 + linear2
  const norms = 2 * 2 * d; // norm1 + norm2, weight and bias
  return attn + ffn + norms; // 12 d^2 + 13 d
}

export function decisionSideParams(d: number, headLayers = 2, nAct = 2) {
  const head = headLayers * encoderLayerParams(d);
  const typeEmb = 3 * d;
  const scorer = 2 * d + (d * d + d) + (d + 1);
  const act = (d + 4) * 256 + 256 + 256 * nAct + nAct;
  return { head, typeEmb, scorer, act, total: head + typeEmb + scorer + act };
}

export const fmtParams = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));
