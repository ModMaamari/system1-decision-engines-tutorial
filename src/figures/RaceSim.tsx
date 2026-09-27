import { useEffect, useRef, useState } from "react";
import { Button, Segmented, Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { T4_LATENCY_MS } from "../data/laya";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Q = 1 | 5 | 10 | 50;
type Ckpt = "laya" | "laya-multilingual";

/** Latency of generating `n` answers of `tokens` tokens after `ttft` ms, at `msPerToken`. */
export function generativeLatency(n: number, tokensPerAnswer: number, ttft: number, msPerToken: number) {
  return ttft + n * tokensPerAnswer * msPerToken;
}

const fmt = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms * 10) / 10} ms`);

export function RaceSim() {
  const reduced = useReducedMotion();
  const [n, setN] = useState<Q>(1);
  const [ckpt, setCkpt] = useState<Ckpt>("laya-multilingual");
  const [ttft, setTtft] = useState(300);
  const [msPerToken, setMsPerToken] = useState(25);
  const [tokens, setTokens] = useState(10);
  const [t, setT] = useState(1); // animation progress 0..1 of the slower racer
  const raf = useRef(0);

  const engine = T4_LATENCY_MS[ckpt][n];
  const llm = generativeLatency(n, tokens, ttft, msPerToken);
  const slow = Math.max(engine, llm);
  const now = t * slow;

  const run = () => {
    cancelAnimationFrame(raf.current);
    if (reduced) {
      setT(1);
      return;
    }
    const duration = 2600;
    const start = performance.now();
    const tick = (ts: number) => {
      const p = Math.min(1, (ts - start) / duration);
      setT(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    setT(0);
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const lanes = [
    {
      id: "engine",
      name: `Decision engine (${ckpt}, measured)`,
      total: engine,
      passes: "1 forward pass",
      tone: "accent",
    },
    {
      id: "llm",
      name: "Generative model (your assumptions)",
      total: llm,
      passes: `1 prefill + ${n * tokens} decode steps`,
      tone: "s2",
    },
  ];

  return (
    <Figure
      title="Latency race: scoring vs generating"
      kind="simulation"
      wide
      actions={
        <Button size="sm" variant="primary" icon="play" onClick={run}>
          Race
        </Button>
      }
      caption={
        <>
          The decision engine's times are Laya's measured latencies on a Tesla T4 for {n} question
          {n > 1 ? "s" : ""} per call (README, “Speed”). The generative model's time is computed from the three
          assumptions you set: time to first token, then one decode step per output token. Real LLM latency varies
          widely with model size, hardware, batching and network, so treat that lane as a what-if, not a
          measurement.
        </>
      }
    >
      <div className="race-controls">
        <div className="race-col">
          <div className="race-col-title">Decision engine</div>
          <Segmented
            label="Questions per call"
            value={String(n) as `${Q}`}
            onChange={(v) => {
              setN(Number(v) as Q);
              setT(1);
            }}
            options={[1, 5, 10, 50].map((q) => ({ value: String(q) as `${Q}`, label: `${q} question${q > 1 ? "s" : ""}` }))}
            size="sm"
          />
          <Segmented
            label="Checkpoint"
            value={ckpt}
            onChange={(v) => {
              setCkpt(v);
              setT(1);
            }}
            options={[
              { value: "laya-multilingual", label: "laya-multilingual" },
              { value: "laya", label: "laya (English)" },
            ]}
            size="sm"
          />
        </div>
        <div className="race-col">
          <div className="race-col-title">Generative model (assumptions)</div>
          <div className="control-grid">
            <Slider label="Time to first token" value={ttft} min={50} max={1500} step={10} onChange={(v) => { setTtft(v); setT(1); }} format={(v) => `${v} ms`} accent="var(--s2)" />
            <Slider label="Time per output token" value={msPerToken} min={5} max={80} step={1} onChange={(v) => { setMsPerToken(v); setT(1); }} format={(v) => `${v} ms`} accent="var(--s2)" />
            <Slider label="Output tokens per answer" value={tokens} min={2} max={40} step={1} onChange={(v) => { setTokens(v); setT(1); }} format={(v) => `${v}`} accent="var(--s2)" />
          </div>
        </div>
      </div>

      <div className="race-lanes">
        {lanes.map((lane) => {
          const frac = Math.min(1, now / slow);
          const done = now >= lane.total - 1e-9;
          const width = Math.min(lane.total, now) / slow;
          return (
            <div key={lane.id} className={`race-lane tone-${lane.tone}`}>
              <div className="race-lane-head">
                <span className="race-lane-name">{lane.name}</span>
                <span className="race-lane-time tabular">{done ? fmt(lane.total) : fmt(Math.min(now, lane.total))}</span>
              </div>
              <div className="race-track" aria-hidden="true">
                <div className="race-fill" style={{ width: `${width * 100}%` }} />
                {!done && frac < 1 && <div className="race-head" style={{ left: `${width * 100}%` }} />}
              </div>
              <div className="race-lane-sub">
                {lane.passes}
                {done && <span className="race-done"> · done</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="race-summary" aria-live="polite">
        {engine < llm ? (
          <>
            With these settings the decision engine answers <b>{(llm / engine).toFixed(1)}×</b> sooner ({fmt(engine)} vs{" "}
            {fmt(llm)}).
          </>
        ) : (
          <>
            With these settings the generative lane is faster ({fmt(llm)} vs {fmt(engine)}): very short answers on a very
            fast serving stack can compete on latency, though not on cost per decision or output validity.
          </>
        )}
      </div>
    </Figure>
  );
}
