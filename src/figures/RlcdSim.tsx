import { useCallback, useEffect, useRef, useState } from "react";
import { LineChart } from "../components/charts/LineChart";
import { ProbBars } from "../components/charts/ProbBars";
import { Button, Segmented, Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { NOTEBOOK_DEFAULTS, ToyRlcd, kl, type RewardKind, type RlcdConfig, type StepInfo } from "../lib/rlcd";
import type { QType } from "../lib/decision";
import { useReducedMotion } from "../hooks/useReducedMotion";

const TARGETS: Record<string, { label: string; type: QType; labels: string[]; t: number[] }> = {
  soft: { label: "Soft teacher (choice)", type: "choice", labels: ["billing", "technical", "sales", "other"], t: [0.55, 0.25, 0.15, 0.05] },
  ambiguous: { label: "Ambiguous case (choice)", type: "choice", labels: ["refund", "cancel", "other"], t: [0.45, 0.4, 0.15] },
  ordinal: { label: "Ordinal (score)", type: "score", labels: ["0", "1", "2", "3"], t: [0.1, 0.2, 0.5, 0.2] },
};

const REWARDS: { value: RewardKind; label: string }[] = [
  { value: "proper", label: "Proper (Laya)" },
  { value: "linear", label: "Linear (improper)" },
  { value: "accuracy", label: "Accuracy 0/1" },
];

const STEPS = 600;

/** What the reader should notice for each reward, with or without the cross-entropy term. */
export function explain(reward: RewardKind, ce: boolean): string {
  if (reward === "proper") {
    return "With a proper reward the model settles on the teacher's distribution, runner-up options included, and the KL divergence goes to about zero. This happens with or without the cross-entropy term, because both have the same optimum.";
  }
  if (reward === "linear") {
    return `The linear score pays for putting mass on likely answers, so it pushes the top option towards 1: the model becomes certain although the teacher was not.${ce ? " The cross-entropy term pulls towards the teacher, but the improper reward overpowers it." : ""}`;
  }
  return ce
    ? "Accuracy only checks the argmax. Once every sample in a group has the same argmax, the rewards are equal, the advantages are zero and the policy gradient adds nothing: the distribution you see is the cross-entropy term's work. Switch it off to see accuracy alone."
    : "Accuracy alone gets the top option right, but once noise stops changing the argmax, learning stalls. The remaining probabilities are an accident of the exploration noise, not a statement about the data.";
}

export function RlcdSim() {
  const reduced = useReducedMotion();
  const [targetId, setTargetId] = useState("soft");
  const [reward, setReward] = useState<RewardKind>("proper");
  const [ce, setCe] = useState(true);
  const [groupSize, setGroupSize] = useState(4);
  const [lr, setLr] = useState(0.05);
  const [running, setRunning] = useState(false);
  const [info, setInfo] = useState<StepInfo | null>(null);
  const [history, setHistory] = useState<{ x: number; y: number }[]>([]);
  const trainer = useRef<ToyRlcd | null>(null);
  const raf = useRef(0);

  const target = TARGETS[targetId];

  const makeConfig = useCallback(
    (): RlcdConfig => ({
      ...NOTEBOOK_DEFAULTS,
      target: target.t,
      type: target.type,
      reward,
      ceWeight: ce ? 1 : 0,
      groupSize,
      lr,
      steps: STEPS,
      seed: 20260922,
    }),
    [target, reward, ce, groupSize, lr],
  );

  const reset = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    trainer.current = new ToyRlcd(makeConfig());
    const k = target.t.length;
    setInfo(null);
    setHistory([{ x: 0, y: kl(target.t, new Array(k).fill(1 / k)) }]);
  }, [makeConfig, target]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const advance = (n: number) => {
    const tr = trainer.current;
    if (!tr) return false;
    let last: StepInfo | null = null;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n && tr.stepCount < STEPS; i++) {
      last = tr.step();
      if (last.step % 3 === 0 || last.step === STEPS) pts.push({ x: last.step, y: last.kl });
    }
    if (last) {
      setInfo(last);
      setHistory((h) => [...h, ...pts]);
    }
    return tr.stepCount < STEPS;
  };

  const run = () => {
    if (running) {
      cancelAnimationFrame(raf.current);
      setRunning(false);
      return;
    }
    if (trainer.current && trainer.current.stepCount >= STEPS) reset();
    if (reduced) {
      advance(STEPS);
      return;
    }
    setRunning(true);
    const tick = () => {
      if (advance(4)) raf.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const k = target.t.length;
  const q = info?.q ?? new Array(k).fill(1 / k);
  const yMax = Math.max(0.5, ...history.map((h) => Math.min(h.y, 8)));

  return (
    <Figure
      title="RLCD, one item at a time"
      kind="simulation"
      wide
      actions={
        <>
          <Button size="sm" icon="step" onClick={() => advance(1)} disabled={running}>
            Step
          </Button>
          <Button size="sm" variant="primary" icon={running ? "pause" : "play"} onClick={run}>
            {running ? "Pause" : "Train"}
          </Button>
          <Button size="sm" icon="reset" onClick={reset}>
            Reset
          </Button>
        </>
      }
      caption={
        <>
          The update is the notebook's, applied to one item whose only parameters are its {k} logits (a real run
          pushes the same gradient through the encoder and head). Defaults are the notebook's: G = 4, σ annealed 0.4 →
          0.1, w_sph = 0.75, soft cross-entropy weight 1. The seed is fixed, so runs are repeatable.
        </>
      }
    >
      <div className="rs-controls">
        <div className="seq-control-group">
          <span className="seq-control-label">Teacher target</span>
          <Segmented label="Target" size="sm" value={targetId} onChange={setTargetId} options={Object.entries(TARGETS).map(([id, t]) => ({ value: id, label: t.label }))} />
        </div>
        <div className="seq-control-group">
          <span className="seq-control-label">Reward</span>
          <Segmented label="Reward" size="sm" value={reward} onChange={setReward} options={REWARDS} />
        </div>
        <div className="seq-control-group">
          <span className="seq-control-label">Group size G</span>
          <Segmented label="Group size" size="sm" value={String(groupSize)} onChange={(v) => setGroupSize(Number(v))} options={["2", "4", "8"].map((g) => ({ value: g, label: g }))} />
        </div>
        <label className="field field-inline">
          <input type="checkbox" checked={ce} onChange={(e) => setCe(e.target.checked)} />
          <span>Add soft cross-entropy (weight 1)</span>
        </label>
        <div className="rs-lr">
          <Slider label="Learning rate (Adam)" value={lr} min={0.005} max={0.2} step={0.005} onChange={setLr} format={(v) => v.toFixed(3)} />
        </div>
      </div>

      <div className="rs-grid">
        <div>
          <div className="qb-col-title">
            Model distribution after step {info?.step ?? 0} <span className="muted">(ticks: teacher target)</span>
          </div>
          <ProbBars
            items={target.labels.map((l, i) => ({ label: l, p: q[i], target: target.t[i], chosen: i === q.indexOf(Math.max(...q)) }))}
            color={target.type === "score" ? "var(--viz-score)" : "var(--viz-choice)"}
            ariaLabel="Model distribution"
          />
          <div className="rs-kpis">
            <span>
              KL(target ‖ model) <b className="tabular">{(info?.kl ?? history[0]?.y ?? 0).toFixed(4)}</b>
            </span>
            <span>
              σ <b className="tabular">{(info?.sigma ?? NOTEBOOK_DEFAULTS.sigmaStart).toFixed(3)}</b>
            </span>
          </div>
          <div className="qb-col-title">This step's group</div>
          {info ? (
            <div className="table-wrap">
              <table className="rs-group">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">sampled q</th>
                    <th scope="col" className="num">
                      reward
                    </th>
                    <th scope="col" className="num">
                      advantage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {info.samples.map((s, g) => (
                    <tr key={g}>
                      <td>#{g + 1}</td>
                      <td className="rs-q">{s.q.map((v) => v.toFixed(2)).join(" ")}</td>
                      <td className="num">{s.r.toFixed(3)}</td>
                      <td className="num">
                        <span className={`rs-adv ${s.adv >= 0 ? "pos" : "neg"}`}>{s.adv >= 0 ? "+" : ""}{s.adv.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted rs-empty">Press Step to sample the first group.</p>
          )}
        </div>
        <div>
          <LineChart
            ariaLabel="KL divergence between the teacher target and the model over training steps"
            series={[{ id: "kl", label: "KL(target ‖ model)", color: "var(--viz-noul)", points: history, area: true }]}
            xDomain={[0, STEPS]}
            yDomain={[0, Number((yMax * 1.05).toFixed(2))]}
            xLabel="step"
            yLabel="KL (nats)"
            formatX={(v) => String(Math.round(v))}
            formatY={(v) => v.toFixed(2)}
            height={260}
          />
          <p className="rs-explain">{explain(reward, ce)}</p>
        </div>
      </div>
    </Figure>
  );
}
