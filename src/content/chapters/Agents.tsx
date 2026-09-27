import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, TableWrap, TypeTag } from "../../components/ui/Blocks";
import { AgentPipeline } from "../../figures/AgentPipeline";

const LANGGRAPH = `from laya.integrations.langchain import LayaGuardrail, LayaRouter

guard = LayaGuardrail(action="raise")            # raises LayaGuardrailError on jailbreak/injection

router = LayaRouter(
    criteria={"billing_agent": "invoices, payment methods, duplicate charges, refunds",
              "tech_support": "system errors, bugs, API downtime, stack traces",
              "sales_agent": "pricing plans, new contracts, demo requests"},
    instructions="Which specialist agent should answer this user query?",
    confidence_threshold=0.80,                   # reads answer_confidence
    fallback="human_agent",                      # below the threshold, go here
    state_key="input",
)
workflow.set_conditional_entry_point(router, {"billing_agent": "billing_agent",
                                              "tech_support": "tech_support",
                                              "sales_agent": "sales_agent",
                                              "human_agent": "human_agent"})`;

const LOOP = `from laya import Router

router = Router(preload=True)
NEXT = {"type": "choice", "instructions": "What should the agent do next to reach the goal?",
        "criteria": {"search": "look something up", "call_api": "use the billing API",
                     "ask_user": "a detail is missing", "finish": "the goal is met"}}

def step(trace):
    res = router.predict({"goal": trace.goal, "history": trace.last_steps(5)},
                         {"next": NEXT}, min_confidence=THRESHOLD)   # fitted on your traces
    ans = res["answers"]["next"]
    if ans.get("low_confidence"):
        return llm_planner(trace)          # System 2 only when System 1 is unsure
    return ans["choice"]`;

const MCP = `{
  "mcpServers": {
    "laya": { "command": "laya-mcp-server", "env": { "LAYA_DEVICE": "cpu" } }
  }
}
// An LLM agent can now call laya_decide / laya_predict as tools for structured
// sub-decisions, and laya_predict_batch to score many items in one call.`;

export default function Agents() {
  return (
    <>
      <Lead>
        An agent is a loop: read the situation, decide, act, look again. Most of the decisions in that loop are small and
        typed. Is this input safe? Which tool, which sub-agent, which model? Is the task finished? Is this output good
        enough to send? If a large language model makes every one of them, each step pays for a full generation. A
        System 1 engine can take many of those decisions in tens of milliseconds and hand the rest to System 2.
      </Lead>

      <AgentPipeline />

      <h2>Where System 1 fits in an agent</h2>
      <TableWrap caption="Measured figures are from Laya's README, BENCHMARKS.md and docs/finetune_browser_agent.md; each holds for that data and setup only.">
        <table>
          <thead>
            <tr>
              <th scope="col">Pattern</th>
              <th scope="col">Typical questions</th>
              <th scope="col">What Laya's numbers say</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Input guardrail</strong> before any LLM call
              </td>
              <td>
                <TypeTag type="noul" /> jailbreak, prompt_injection, sensitive_data; <TypeTag type="score" /> harm_severity
              </td>
              <td>0.71–0.76 on held-out jailbreak data: a useful first filter, not a sole line of defence</td>
            </tr>
            <tr>
              <td>
                <strong>Routing edge</strong> to a specialist agent
              </td>
              <td>
                <TypeTag type="choice" /> which agent or queue
              </td>
              <td>0.76 on the fine-tuned customer-service workflow; the base checkpoints score only 0.50–0.52 on a 10-way support queue</td>
            </tr>
            <tr>
              <td>
                <strong>Model cascade</strong>: small or frontier model
              </td>
              <td>
                <TypeTag type="score" /> difficulty, <TypeTag type="choice" /> domain, <TypeTag type="noul" /> needs_tools
              </td>
              <td>Held-out domain routing: 0.64–0.66 on the English checkpoints, 0.12 multilingual; route English text to English</td>
            </tr>
            <tr>
              <td>
                <strong>Next action and target</strong> in a tool or browser agent
              </td>
              <td>
                <TypeTag type="choice" /> operation, <TypeTag type="choice" /> which element
              </td>
              <td>Fine-tuned: element top-1 among ~45 candidates 0.10 → 0.66; 62% of real tasks at 17–23 ms per step</td>
            </tr>
            <tr>
              <td>
                <strong>Stop, continue, escalate</strong> and trace review
              </td>
              <td>
                <TypeTag type="noul" /> needs_review, <TypeTag type="choice" /> outcome, <TypeTag type="score" /> risk
              </td>
              <td>The “agent trace observability” workflow: 0.730 after fine-tuning</td>
            </tr>
            <tr>
              <td>
                <strong>Output check</strong> (a fast judge)
              </td>
              <td>
                <TypeTag type="noul" /> follows policy, grounded in the source; <TypeTag type="score" /> rubric
              </td>
              <td>LangChain ships a LayaEvaluator for rubric grading; validate it against human labels first</td>
            </tr>
            <tr>
              <td>
                <strong>Retrieval gate</strong> for RAG or memory
              </td>
              <td>
                <TypeTag type="noul" /> does this passage answer the question?
              </td>
              <td>RAG passage relevance 0.63–0.66: good for pruning, weak as a final judge</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <h2>Three ways to wire it in</h2>
      <h3>1. As graph edges</h3>
      <p>
        In LangGraph, a conditional edge is a function from state to the next node. <code>LayaRouter</code> is such a
        function: it answers a choice question over the node names and falls back to a named node when{" "}
        <code>answer_confidence</code> is below the threshold. <code>LayaGuardrail</code> screens inputs, and{" "}
        <code>batch()</code> calls share forward passes.
      </p>
      <CodeBlock code={LANGGRAPH} title="Python · LangGraph (docs/langchain.md)" />

      <h3>2. Inside your own loop</h3>
      <p>
        Any agent framework can ask a typed question at each step and fall back to an LLM planner when the answer is
        uncertain. Put the <em>candidates</em> in the options, not in the state (see below).
      </p>
      <CodeBlock code={LOOP} title="Python · a confidence-gated next-step decision (sketch)" />

      <h3>3. As tools for an LLM agent</h3>
      <p>
        Through the MCP server, an LLM-driven agent can call typed decisions as tools (<code>laya_predict</code>,{" "}
        <code>laya_decide</code>, <code>laya_predict_batch</code>, <code>laya_route</code>, <code>laya_shortlist</code>,{" "}
        <code>laya_preset</code>) instead of reasoning through every classification itself. Community projects do the
        same for other stacks: an MCP judge with confidence-gated escalation, Google ADK tools, and a Jev-compatible
        local server that trains a head per decision.
      </p>
      <CodeBlock lang="json" code={MCP} title="MCP client configuration" />

      <h2>Lessons from a real agent: the browser-agent fine-tune</h2>
      <p>
        Laya's docs record a complete specialisation for browser-use's <code>jev-ultrafast</code> agent: choose the next
        operation (click, type, select, done) and the target element, on one 16 GB GPU with no paid API. Zero-shot, the
        model picked the right element 10% of the time among about 45 candidates, which is chance. Fine-tuned, it
        reached 0.66 (421M) and 0.63 (322M), and completed 62% of 16 live tasks (322M) at 17–23 ms per step. What
        mattered:
      </p>
      <ul>
        <li>
          <strong>Input format beat data.</strong> With the page's element table inside the state, the 1,024-token
          window truncated most candidates. Moving the elements into the option list (<code>head_max_len</code> 512 →
          768) raised click top-1 on Mind2Web from 0.44 to 0.51 and live tasks from 6/16 to 10/16, more than any data
          change.
        </li>
        <li>
          <strong>Data built from the agent's own world.</strong> Goals reverse-generated from real elements, real
          “done” states from executed actions, mid-task negatives, Mind2Web, and on-policy corrections (DAgger).
        </li>
        <li>
          <strong>Shortcuts the model will learn if you let it.</strong> Templated “done” goals leaked phrasing, and a
          history always present in “done” examples taught “any history means done”.
        </li>
        <li>
          <strong>Escalation is not free.</strong> Confidence-gated escalation to a local 8B or 27B LLM made results{" "}
          <em>worse</em>: on those pages the fine-tuned 322M model was the better decider (0.890 operation accuracy at 21
          ms, against 0.861 at 4.7 s for the 27B model with a thinking budget).
        </li>
      </ul>

      <Callout type="warning" title="Design rules for agents">
        <ul>
          <li>Measure every gate on your agent's own traces; zero-shot numbers are a starting point, not a guarantee.</li>
          <li>Fit calibration and choose thresholds per decision, and log every decision with its probabilities (hooks).</li>
          <li>Keep irreversible actions behind review, however confident the engine is (chapter 13).</li>
          <li>Measure the escalation path too: a larger model is not automatically a better decider.</li>
          <li>Keep option sets small; shortlist or split when an agent has dozens of candidate tools or elements.</li>
        </ul>
      </Callout>

      <KeyTakeaways
        items={[
          "Agent loops are full of small typed decisions; a System 1 engine can answer many of them in tens of milliseconds.",
          "Common placements: input guardrails, routing edges, model cascades, next-action selection, stop/escalate checks, output checks and retrieval gates.",
          "Gate each decision on calibrated confidence and escalate to System 2 (an LLM or a person) only when needed.",
          "Fine-tuning on the agent's own traces is what makes it work: the browser agent went from chance to 0.66 element accuracy.",
          "Put candidates in the options, keep them few, and measure the escalation path as carefully as the fast path.",
        ]}
      />
    </>
  );
}
