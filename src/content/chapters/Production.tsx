import { useState } from "react";
import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Figure } from "../../components/ui/Figure";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { GatingSim } from "../../figures/GatingSim";

const SHADOW = `from laya import Router

class ShadowLog:                              # an application-owned hook, not a Laya API
    def on_predict_end(self, ctx):
        result = ctx.results[0] if ctx.results else None
        write_shadow_record({"run_id": ctx.run_id, "model": ctx.model, "decision": ctx.decision,
                             "result": result, "elapsed_ms": ctx.elapsed_ms,
                             "error": None if ctx.error is None else repr(ctx.error)})

router = Router(hooks=[ShadowLog()])

def handle(request):
    try:
        router.predict(request.state, request.questions)   # recorded by the hook, not acted on
    except Exception as exc:
        record_laya_failure(request, exc)
    return run_incumbent_action(request)                   # the incumbent stays authoritative`;

const REDACT = `import re

class Redact:
    """Remove e-mail addresses before the model (or any log) sees the text."""
    def on_predict_start(self, ctx):
        ctx.states = [re.sub(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+", "<email>", s) if isinstance(s, str) else s
                      for s in ctx.states]

agent = laya.load("convaiinnovations/laya", hooks=[Redact(), AuditLog()])`;

const STAGES = [
  {
    id: "shadow",
    title: "1. Shadow",
    body: "Run the engine on real traffic, but keep the existing process authoritative. Log the question schema, answer, probabilities, confidence, checkpoint, run_id, latency and errors, and later the reviewed or true outcome. Logging must never become a user-facing action.",
  },
  {
    id: "compare",
    title: "2. Compare",
    body: "Compare with the incumbent on the same requests. A disagreement is a signal, not a verdict: the incumbent may be wrong or the case ambiguous. Keep an explicit “unknown / needs review” bucket, and slice by checkpoint, language, schema, action type and risk.",
  },
  {
    id: "policy",
    title: "3. Choose a policy",
    body: "Fit calibration on representative held-out data, then choose a threshold from measured accuracy and error cost at the coverage you can accept. Record the checkpoint, schema version, calibration method, threshold, evaluation set and owner. High confidence is never execution permission by itself.",
  },
  {
    id: "promote",
    title: "4. Promote a bounded slice",
    body: "Enable automation for an eligible slice: evaluated checkpoint, language and schema; reversible action or a review path; no missing context; a traffic cap and a named rollback condition. Keep sampling automated decisions and roll back when a guardrail is breached.",
  },
];

const CHECKLIST = [
  "Shadow logging is side-effect free and correlated by run_id.",
  "Comparison data includes the incumbent outcome and reviewed labels where available.",
  "Thresholds are fitted and validated on representative held-out data.",
  "Irreversible or high-cost actions have an explicit review boundary.",
  "Promotion is bounded, sampled and reversible, with a named fallback and rollback path.",
  "The policy owner and re-evaluation trigger are recorded.",
];

function StagedAdoption() {
  const [active, setActive] = useState("shadow");
  const [done, setDone] = useState<Set<number>>(new Set());
  const stage = STAGES.find((s) => s.id === active)!;
  return (
    <Figure title="Staged adoption, from shadow to promotion" kind="diagram" wide caption="Condensed from Laya's docs/staged-adoption.md. The application owns the action, the threshold, review, fallback and rollback; the engine supplies evidence.">
      <div className="sa-track" role="tablist" aria-label="Adoption stages">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === active}
            className={`sa-stage ${s.id === active ? "is-active" : ""} ${STAGES.findIndex((x) => x.id === active) > i ? "is-past" : ""}`}
            onClick={() => setActive(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>
      <p className="sa-body" role="tabpanel">
        {stage.body}
      </p>
      <div className="qb-col-title">Rollout checklist</div>
      <ul className="sa-checklist">
        {CHECKLIST.map((c, i) => (
          <li key={c}>
            <label>
              <input
                type="checkbox"
                checked={done.has(i)}
                onChange={() => {
                  const next = new Set(done);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  setDone(next);
                }}
              />
              <span>{c}</span>
            </label>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

export default function Production() {
  return (
    <>
      <Lead>
        A decision engine returns a typed decision, not permission to execute it. Putting one into production is about
        the policy around the call: which answers to act on, what to do with the rest, how to watch it, and how to
        roll it out without betting the business on a benchmark.
      </Lead>

      <h2>Confidence gating: automate some, escalate the rest</h2>
      <p>
        The basic pattern is a threshold on <code>answer_confidence</code>: act automatically above it, send the rest to
        a human, a rule, or a larger model. Lowering the threshold automates more but lets more mistakes through; raising
        it does the opposite. Laya's README is firm that the threshold is a policy you choose from measured accuracy at
        that coverage, on your own data, and that it depends on the precision you serve in. Confidence orders decisions;
        it does not establish that a decision is correct.
      </p>
      <GatingSim />
      <p>
        Two things are worth noticing in the simulation. First, with raw, over-confident scores, the number on the
        threshold is misleading: a “0.85” threshold automates answers that are right far less often. After a temperature
        fit it roughly means what it says. Second, the best threshold depends on what mistakes and reviews cost you, not
        on the model alone.
      </p>
      <Callout type="laya">
        <code>min_confidence=</code> on <code>predict</code>, <code>predict_batch</code> and <code>decide</code> marks
        answers below the threshold with <code>low_confidence: true</code> (and <code>decide</code> returns{" "}
        <code>None</code> for them), without changing the answer. The LangChain <code>LayaRouter</code> takes a{" "}
        <code>confidence_threshold</code> and a <code>fallback</code> node for the same purpose.
      </Callout>

      <h2>Staged adoption</h2>
      <StagedAdoption />
      <CodeBlock code={SHADOW} title="Python · a shadow deployment (from docs/staged-adoption.md)" />

      <h2>Hooks: observe and shape every decision</h2>
      <p>
        Hooks are how you add audit logs, PII redaction, caching, metrics, guardrails and routing overrides without
        forking the library. A hook is a callable or an object with any of <code>on_predict_start</code>,{" "}
        <code>on_predict_end</code>, <code>on_route</code>, <code>on_load</code>, <code>on_evict</code> and{" "}
        <code>on_error</code>. One context object flows through a call, so a <code>run_id</code> correlates its events.{" "}
        <Source path="laya/hooks.py" />
      </p>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">When</th>
              <th scope="col">A hook can</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>on_route</code>
              </td>
              <td>Router only, after detection</td>
              <td>replace the routing decision (pin a checkpoint)</td>
            </tr>
            <tr>
              <td>
                <code>on_load</code> / <code>on_evict</code>
              </td>
              <td>a checkpoint is built or dropped</td>
              <td>record model lifecycle</td>
            </tr>
            <tr>
              <td>
                <code>on_predict_start</code>
              </td>
              <td>before tokenisation</td>
              <td>
                rewrite states or questions (redaction), set token budgets, or <code>ctx.skip(results)</code> to answer
                from a cache
              </td>
            </tr>
            <tr>
              <td>
                <code>on_error</code>
              </td>
              <td>inference raised</td>
              <td>record the failure; the error is re-raised</td>
            </tr>
            <tr>
              <td>
                <code>on_predict_end</code>
              </td>
              <td>always, success or failure</td>
              <td>log, measure, or rewrite the results</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <CodeBlock code={REDACT} title="Python · redact before inference" />
      <Callout type="warning" title="Anti-patterns from the hooks guide">
        Do not block the request path with slow work (enqueue it instead), use end hooks for control flow, share mutable
        state without a lock, fail silently, keep every context in memory, redact in an end hook (too late: the model
        already read it), or call <code>predict</code> from inside a hook on the same agent.
      </Callout>

      <h2>Throughput, deployment and integrity</h2>
      <ul>
        <li>
          <strong>Batch on GPUs.</strong> <code>predict_batch</code> shares forward passes: about 10 ms to 1 ms per
          decision on an RTX 5060 Ti in the README's measurement. On CPUs, batching helps little, but grouping inputs by
          length can (an ONNX example went from 53.7 s to 36.3 s with no decision changes).
        </li>
        <li>
          <strong>Preload on servers</strong> so a language switch never rebuilds a checkpoint (chapter 11).
        </li>
        <li>
          <strong>Pick a runtime.</strong> PyTorch with optional TileLang fast path on CUDA, ONNX Runtime (with an INT8
          export for CPUs), Docker images for CPU and NVIDIA hosts, or <code>laya-ts</code> in Node and the browser.
        </li>
        <li>
          <strong>Pin what you run.</strong> <code>revision=</code> (or <code>LAYA_REVISION</code>) pins a Hub commit,
          and <code>expected_sha256=</code> verifies every artifact before any weight is parsed. <code>laya-serve</code>{" "}
          supports bearer-token auth, reports the device a checkpoint really runs on in <code>/health</code>, and answers
          503 with <code>Retry-After</code> when busy.
        </li>
        <li>
          <strong>Gate releases on evaluations.</strong> <code>laya-evals</code> scores a labelled dataset and exits
          non-zero when accuracy or ECE crosses a threshold or regresses against a baseline, so it drops into CI
          (chapter 16).
        </li>
      </ul>

      <KeyTakeaways
        items={[
          "Gate on answer_confidence, and choose the threshold from measured accuracy, coverage and the cost of errors versus reviews, on your data.",
          "Calibrate first: with raw, over-confident scores, a threshold does not mean what it says.",
          "Roll out in stages (shadow, compare, choose a policy, promote a bounded slice) and keep the incumbent authoritative until the evidence is in.",
          "Use hooks for audit, redaction (in start hooks), caching and metrics; keep them fast and never let them fail silently.",
          "Batch on GPUs, preload on servers, pin revisions and checksums, and gate releases on an evaluation set.",
        ]}
      />
    </>
  );
}
