import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { ProbBars } from "../components/charts/ProbBars";
import { useReducedMotion } from "../hooks/useReducedMotion";

/** The generated answer, split roughly as a BPE tokenizer would. */
const AR_TOKENS = [
  '{"', "department", '":', ' "', "billing", '",', ' "', "urgency", '":', " 2", ",", ' "', "churn", "_risk", '":', " true", "}", "<eos>",
];

const SEQ = [
  { t: "[CLS]", k: "special" },
  { t: "choice question: Which department…", k: "head" },
  { t: "[SEP]", k: "special" },
  { t: "[MASK]", k: "mask" },
  { t: "billing: invoices…", k: "opt" },
  { t: "[MASK]", k: "mask" },
  { t: "technical: bugs…", k: "opt" },
  { t: "[MASK]", k: "mask" },
  { t: "other", k: "opt" },
  { t: "[SEP]", k: "special" },
  { t: "Hi, we were billed twice for March…", k: "state" },
  { t: "[SEP]", k: "special" },
] as const;

const DIST = [
  { label: "billing", p: 0.94 },
  { label: "technical", p: 0.04 },
  { label: "other", p: 0.02 },
];

const TOKEN_MS = 260;

export function OnePassHero() {
  const reduced = useReducedMotion();
  const [arCount, setArCount] = useState(reduced ? AR_TOKENS.length : 0);
  const [nar, setNar] = useState<"idle" | "pass" | "done">(reduced ? "done" : "idle");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = () => {
    clear();
    if (reduced) {
      setArCount(AR_TOKENS.length);
      setNar("done");
      return;
    }
    setRunning(true);
    setArCount(0);
    setNar("idle");
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(300, () => setNar("pass"));
    at(300 + 700, () => setNar("done"));
    AR_TOKENS.forEach((_, i) => at(300 + (i + 1) * TOKEN_MS, () => setArCount(i + 1)));
    at(300 + AR_TOKENS.length * TOKEN_MS + 100, () => setRunning(false));
  };

  useEffect(() => {
    play();
    return clear;
    // Play once on mount; replays are user-initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const narPasses = nar === "idle" ? 0 : 1;

  return (
    <Figure
      title="Two ways to get the same decision"
      kind="simulation"
      wide
      actions={
        <Button size="sm" icon={running ? "pause" : "reset"} onClick={play} disabled={running}>
          {running ? "Running" : "Replay"}
        </Button>
      }
      caption={
        <>
          Left: a generative model writes its answer one token per forward pass, and the program then
          parses the text. Right: a decision engine reads the question, its options and the state
          together and scores every option in one forward pass (Laya batches one row per question, so
          three questions are still one call). Timing and token boundaries are illustrative; the
          probabilities are example values.
        </>
      }
    >
      <div className="hero-grid">
        <section className="hero-panel is-ar" aria-label="Autoregressive generation">
          <header className="hero-panel-head">
            <span className="hero-dot" />
            <span>Autoregressive: generate the answer</span>
          </header>
          <div className="hero-prompt">
            <span className="hero-prompt-label">prompt</span>
            Route this ticket. Reply as JSON with department, urgency (0–2) and churn_risk. Ticket: “Hi, we were
            billed twice for March…”
          </div>
          <div className="hero-output" aria-live="off">
            {AR_TOKENS.slice(0, arCount).map((t, i) => (
              <span key={i} className={`ar-token ${i === arCount - 1 && running ? "is-new" : ""} ${t === "<eos>" ? "is-eos" : ""}`}>
                {t}
              </span>
            ))}
            {arCount < AR_TOKENS.length && <span className="ar-caret" />}
          </div>
          <div className="hero-meter">
            <span className="hero-meter-num tabular">{arCount}</span> forward passes
            <span className="hero-meter-sub">then parse and validate the text</span>
          </div>
        </section>

        <section className="hero-panel is-nar" aria-label="Non-autoregressive decision">
          <header className="hero-panel-head">
            <span className="hero-dot" />
            <span>Non-autoregressive: score the options</span>
          </header>
          <div className={`hero-seq ${nar !== "idle" ? "is-pass" : ""}`}>
            {SEQ.map((s, i) => (
              <span key={i} className={`seq-chip chip-${s.k}`} style={{ transitionDelay: `${i * 30}ms` }}>
                {s.t}
              </span>
            ))}
          </div>
          <div className={`hero-dist ${nar === "done" ? "is-shown" : ""}`}>
            <ProbBars
              compact
              ariaLabel="Probability over departments"
              items={DIST.map((d) => ({ ...d, p: nar === "done" ? d.p : 0, chosen: nar === "done" && d.label === "billing" }))}
            />
            <div className="hero-extra">
              <span>
                urgency <b className="tabular">1.84</b> <span className="muted">expected level of 0–2</span>
              </span>
              <span>
                churn_risk <b className="tabular">0.89</b> <span className="muted">P(true)</span>
              </span>
            </div>
          </div>
          <div className="hero-meter">
            <span className="hero-meter-num tabular">{narPasses}</span> forward pass
            <span className="hero-meter-sub">the output is already a distribution</span>
          </div>
        </section>
      </div>
    </Figure>
  );
}
