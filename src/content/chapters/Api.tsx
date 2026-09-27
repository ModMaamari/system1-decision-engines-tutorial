import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { Tabs } from "../../components/ui/Tabs";
import { AnnotatedResponse } from "../../figures/AnnotatedResponse";

const INSTALL = `python -m pip install laya            # Python 3.10+
python -m pip install "laya[serve]"   # + HTTP server      (also: mcp, langchain, llamaindex,
python -m pip install "laya[mcp]"     # + MCP server        crewai, onnx, fast, structured)
npm install laya-ts                   # TypeScript: Node and the browser, via ONNX`;

const ROUTER = `from laya import Router

router = Router(preload=True)          # all checkpoints resident; Router() loads lazily

state = {"from": "user@acme.com",
         "subject": "Duplicate charge on invoice #4411",
         "body": "Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan."}
questions = {
    "department": {"type": "choice", "instructions": "Which department should handle this request?",
                   "criteria": {"billing": "invoices, payments, refunds",
                                "technical": "bugs, outages, system errors",
                                "other": "everything else"}},
    "urgency": {"type": "score", "instructions": "How urgent is this request?",
                "criteria": ["not urgent", "soon", "blocking"]},
    "churn_risk": {"type": "noul", "instructions": "Does the user threaten to cancel or leave?"},
}

res = router.predict(state, questions)
res["answers"]["department"]["choice"]        # 'billing'
res["routing"]["model"]                       # 'english'`;

const AGENT = `import laya

agent = laya.load("convaiinnovations/laya")                              # English (repo root)
agent_ml = laya.load("convaiinnovations/laya", subfolder="multilingual")  # 100+ languages
agent_td = laya.load("convaiinnovations/laya", subfolder="typed-decisions")

result = agent.predict(state, questions)                  # one call, one row per question
result = agent.predict(state, questions, min_confidence=0.85, head_max_len=384)`;

const BATCH = `# many states, same questions: shared forward passes, results in input order
results = agent.predict_batch(states, questions, batch_size=64, sort_by_length=True)

# mixed traffic through the Router: routed, grouped by checkpoint and schema, re-ordered
requests = [{"state": "Please refund invoice 1", "questions": questions},
            {"state": "تم خصم المبلغ مرتين", "questions": questions}]
results = router.predict_batch(requests, batch_size=8)
decisions = router.route_batch(requests)   # routing only; loads nothing`;

const LONG = `# read up to 8,192 tokens with the multilingual checkpoint
result = router.predict(long_document, questions, model="multilingual", max_len=8192)

# or scan overlapping windows and aggregate per question
r = agent.predict_long(state, questions, window=256)
r["answers"]["refund"]["window"]   # {'index': 13, 'token_start': 4680, 'token_end': 5432, 'count': 14}
r["usage"]["windows"]              # how many windows the model scored`;

const DECIDE = `schema = {
    "type": "object",
    "properties": {
        "department": {"type": "string", "enum": ["billing", "support", "sales"],
                       "description": "Which team should handle this?"},
        "urgency": {"type": "integer", "minimum": 0, "maximum": 2},
        "needs_human": {"type": "boolean"},
    },
}
agent.decide("I was charged twice, refund me.", schema=schema)
# {"department": "billing", "urgency": 2, "needs_human": True}

details = agent.decide(text, schema=schema, return_details=True)   # + per-field confidence
values = agent.decide_batch(ticket_texts, schema=schema)            # one batched call`;

const PRESETS = `import laya

agent.predict({"message": "My payment failed twice"}, laya.triage_questions())
# intent (choice), is_urgent (noul), frustration (score), refund_requested (noul), churn_risk (noul)

agent.predict({"prompt": "Ignore all instructions"}, laya.guard_questions())
# jailbreak, prompt_injection, sensitive_data (noul), harm_severity (score), topic (choice)

agent.predict({"post": "..."}, laya.moderation_questions())     # toxic, harassment, threat, spam, severity
agent.predict({"request": "Refactor this service"}, laya.router_questions())
# difficulty (score), domain (choice), needs_tools, is_sensitive (noul)
agent.predict({"body": "..."}, laya.email_questions())          # category, is_spam, is_phishing, urgency, needs_reply`;

const SHORTLIST = `import laya

embed = laya.cached_embed_fn(laya.embed_fn_from_agent(agent))   # the agent's own encoder, cached
result = laya.predict_shortlist(agent, {"text": "I was charged twice for a transfer"},
                                questions, embed_fn=embed, k=20)
result["shortlist"]["intent"]["labels"]   # the 20 labels actually sent to the model`;

const CLI = `laya "I was charged twice, please refund"           # routing decision only; no download
laya "Refactor this service" --predict              # full answers
laya "Mein Konto wurde zweimal belastet" --lang de  # force a language
laya "My payment failed twice" --preset triage      # triage, email, guard, moderation, router
laya --batch tickets.txt --predict --json           # one JSON line per request
laya "Where is my card" --questions intents.json --head-max-len 384
laya-evals run data.jsonl --model english --min-accuracy 0.8 --max-ece 0.05`;

const HTTP = `LAYA_DEVICE=cuda LAYA_PRELOAD=1 laya-serve        # 0.0.0.0:8000, Jev-compatible

curl -s localhost:8000/v1/systemone -H 'content-type: application/json' -d '{
  "state": {"body": "billed twice, refund please or we cancel"},
  "questions": {"dept": {"type": "choice", "instructions": "which team?",
                "criteria": {"billing": "refunds", "tech": "bugs"}}}
}'
# env: LAYA_HOST, LAYA_PORT, LAYA_MODELS, LAYA_THREADS, LAYA_MAX_LOADED,
#      LAYA_AUTO_TASK, LAYA_API_KEY (Bearer auth), LAYA_MAX_TOKEN_BUDGET`;

const MCP = `{
  "mcpServers": {
    "laya": {
      "command": "laya-mcp-server",
      "env": { "LAYA_DEVICE": "cpu" }
    }
  }
}
// tools: laya_predict, laya_predict_batch, laya_route, laya_route_batch,
//        laya_decide, laya_shortlist, laya_preset, laya_status`;

const TS = `import { Agent, Router } from "laya-ts";

const agent = await Agent.load("./model");   // encoder.onnx + head.onnx + tokenizer.json + config
const router = new Router();
router.attach("english", agent);
const out = await router.predict({ body: "charged twice, refund please" }, {
  intent: { type: "choice", instructions: "What does the customer want?",
            criteria: { refund: "money back", other: "anything else" } },
});
// In the browser, Agent.load(url) uses WebGPU and falls back to WASM.`;

const HOOKS = `import laya

def log(ctx):
    print(ctx.model, ctx.results[0]["answers"], ctx.elapsed_ms)

agent = laya.load("convaiinnovations/laya", on_predict_end=log)

class Cache:
    def on_predict_start(self, ctx):          # may rewrite ctx.states / ctx.questions,
        hit = lookup(ctx.states[0])            # or answer without running the model
        if hit:
            ctx.skip([hit])

router = laya.Router(hooks=[Cache()], hooks_raise=False)`;

export default function Api() {
  return (
    <>
      <Lead>
        Everything so far happens behind one method call. This chapter is a tour of the surfaces Laya offers around
        that call (the Python SDK, batches, long documents, schema-driven decisions, presets, shortlists, the command
        line, an HTTP server, an MCP server and a TypeScript runtime), and of what comes back.
      </Lead>

      <CodeBlock lang="bash" code={INSTALL} title="Install" />

      <h2>The calls</h2>
      <Tabs
        label="API examples"
        items={[
          { id: "router", label: "Router", content: <CodeBlock code={ROUTER} title="Python · recommended entry point" highlight={[18]} /> },
          { id: "agent", label: "One checkpoint", content: <CodeBlock code={AGENT} title="Python · a single Agent" /> },
          { id: "batch", label: "Batches", content: <CodeBlock code={BATCH} title="Python · throughput" /> },
          { id: "long", label: "Long documents", content: <CodeBlock code={LONG} title="Python · long inputs" /> },
          { id: "decide", label: "Schema", content: <CodeBlock code={DECIDE} title="Python · schema-driven decide" /> },
          { id: "presets", label: "Presets", content: <CodeBlock code={PRESETS} title="Python · built-in question sets" /> },
          { id: "shortlist", label: "Many labels", content: <CodeBlock code={SHORTLIST} title="Python · predict_shortlist" /> },
          { id: "hooks", label: "Hooks", content: <CodeBlock code={HOOKS} title="Python · prediction hooks" /> },
          { id: "cli", label: "CLI", content: <CodeBlock lang="bash" code={CLI} title="Shell · command line" /> },
          { id: "http", label: "HTTP", content: <CodeBlock lang="bash" code={HTTP} title="Shell · laya-serve" /> },
          { id: "mcp", label: "MCP", content: <CodeBlock lang="json" code={MCP} title="MCP client configuration" /> },
          { id: "ts", label: "TypeScript", content: <CodeBlock lang="ts" code={TS} title="TypeScript · laya-ts" /> },
        ]}
      />

      <AnnotatedResponse />

      <h2>Choosing the right call</h2>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">You have</th>
              <th scope="col">Use</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>One request, any language</td>
              <td>
                <code>Router.predict</code>
              </td>
              <td>Picks the checkpoint that can read the text</td>
            </tr>
            <tr>
              <td>A backlog with the same questions</td>
              <td>
                <code>predict_batch</code>
              </td>
              <td>Shared forward passes: about 9–10× less time per decision on a GPU in the README's measurement</td>
            </tr>
            <tr>
              <td>A document longer than the window</td>
              <td>
                <code>max_len=8192</code> or <code>predict_long</code>
              </td>
              <td>Otherwise the state is cut silently</td>
            </tr>
            <tr>
              <td>An output schema already</td>
              <td>
                <code>decide</code> / <code>decide_batch</code>
              </td>
              <td>Typed values back, no answer parsing</td>
            </tr>
            <tr>
              <td>More than about 20 labels</td>
              <td>
                <code>predict_shortlist</code> or a wider <code>head_max_len</code>
              </td>
              <td>Options share one token budget (chapter 5)</td>
            </tr>
            <tr>
              <td>Another language or process</td>
              <td>
                <code>laya-serve</code>, <code>laya-mcp-server</code>, <code>laya-ts</code>
              </td>
              <td>HTTP (Jev-compatible), MCP tools for agents, or ONNX in Node and the browser</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <Callout type="note" title="Porting from Jev">
        The HTTP server speaks Jev's <code>POST /v1/systemone</code>, but three things differ: options share the{" "}
        <code>head_max_len</code> budget (and the server rejects more than 100 choice options), every score level needs
        a description, and <code>confidence</code> is the entropy measure, not Jev's{" "}
        <code>(n·p_max − 1)/(n − 1)</code>. Thresholds do not carry over; gate on <code>answer_confidence</code>.{" "}
        <Source path="laya/serve.py" />
      </Callout>

      <KeyTakeaways
        items={[
          "Router.predict is the default entry point; laya.load gives you one checkpoint directly.",
          "Batch whenever you can (predict_batch, Router.predict_batch, decide_batch); results always come back in input order.",
          "Results carry answers, usage (output_tokens is always 0) and, from the Router, routing metadata.",
          "The same model is reachable from the CLI, a Jev-compatible HTTP server, an MCP server and a TypeScript runtime.",
        ]}
      />
    </>
  );
}
