import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, StatGrid, TypeTag } from "../../components/ui/Blocks";
import { Icon, type IconName } from "../../components/Icon";
import { OnePassHero } from "../../figures/OnePassHero";
import { CHAPTERS, PARTS } from "../chapters";

const REQUEST = `from laya import Router

router = Router()   # picks a checkpoint per request (chapter 11)

state = "Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan."
questions = {
    "department": {"type": "choice", "instructions": "Which department should handle this?",
                   "criteria": {"billing": "invoices, payments, refunds",
                                "technical": "bugs, outages, system errors",
                                "other": "everything else"}},
    "urgency": {"type": "score", "instructions": "How urgent is this?",
                "criteria": ["not urgent", "soon", "blocking"]},
    "churn_risk": {"type": "noul", "instructions": "Does the user threaten to cancel or leave?"},
}

result = router.predict(state, questions)
print(result["answers"]["department"]["choice"])  # billing
print(result["answers"]["churn_risk"]["noul"])    # probability the answer is yes
print(result["routing"]["model"])                 # english`;

const PROPERTIES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "zap",
    title: "Non-autoregressive",
    body: "The whole answer comes out of one forward pass. Nothing is generated token by token, so latency does not grow with the length of an answer.",
  },
  {
    icon: "layers",
    title: "Typed",
    body: "You ask choice, score and noul questions with the options spelled out. The output is always a distribution over exactly those options: there is no text to parse and no invalid label.",
  },
  {
    icon: "target",
    title: "Calibrated, when fitted",
    body: "The model is trained against proper scoring rules, and one temperature per question type is fitted afterwards, so a confidence can be used to decide what to automate.",
  },
];

const PART_ICONS: Record<string, IconName> = {
  foundations: "book",
  engine: "layers",
  training: "flask",
  using: "zap",
  applications: "target",
  review: "check",
};

export default function Intro() {
  return (
    <>
      <Lead>
        Most decisions inside software are not open questions. <em>Which team gets this ticket? Is this prompt
        trying to jailbreak the assistant? How urgent is this email?</em> Each has a small, known set of answers.
        A <strong>System 1 decision engine</strong> is a model built for exactly that shape of problem: it reads
        an input and a set of typed questions and returns a probability for every allowed answer, in a single
        forward pass, without writing any text.
      </Lead>

      <OnePassHero />

      <h2>A working definition</h2>
      <p>
        Throughout this tutorial, a <strong>non-autoregressive System 1 decision engine</strong> means a model
        with this contract:
      </p>
      <ul>
        <li>
          <strong>Input:</strong> a <em>state</em> (a string, a JSON document, an email, a conversation) plus one
          or more <em>questions</em>. Each question has a type, instructions written in plain language, and a
          fixed set of options.
        </li>
        <li>
          <strong>Computation:</strong> one forward pass of an encoder over the question, its options and the
          state together. The options are scored side by side, in context.
        </li>
        <li>
          <strong>Output:</strong> for every question, a probability distribution over its options and the answer
          derived from it: the chosen label for <TypeTag type="choice" />, an expected level for{" "}
          <TypeTag type="score" />, and P(yes) for <TypeTag type="noul" />.
        </li>
      </ul>
      <p>
        The name borrows Daniel Kahneman's “System 1”: fast, automatic judgement, as opposed to the slow,
        deliberate reasoning of “System 2”. The next chapter looks at that analogy closely, including where it
        stops being useful.
      </p>

      <div className="feature-grid">
        {PROPERTIES.map((p) => (
          <div key={p.title} className="feature-card">
            <span className="feature-icon" aria-hidden="true">
              <Icon name={p.icon} size={18} />
            </span>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>

      <h2>The reference implementation: Laya</h2>
      <p>
        This tutorial uses <a href="https://github.com/NandhaKishorM/laya" target="_blank" rel="noreferrer">Laya</a>{" "}
        as its worked example. Laya is an open-source (Apache 2.0) Python library and a family of checkpoints from
        Convai Innovations, described by its authors as a “multilingual, non-autoregressive System 1 decision
        engine”. It is a good teaching example because everything is inspectable: the model code, the training
        recipe, the calibration step, the benchmarks, and a long list of documented limits.
      </p>
      <p>Here is the whole idea in one call, taken from Laya's README:</p>
      <CodeBlock code={REQUEST} title="Python · the Laya quickstart" highlight={[18]} />
      <p>
        Three questions of three different types go in; three typed answers come out, each with its full
        probability distribution. The <code>Router</code> first chose which checkpoint should read the text: this
        one is English, so it went to the English checkpoint.
      </p>

      <StatGrid
        items={[
          { value: "32.8 ms", label: "one question, laya-multilingual", note: "Tesla T4, measured (README)" },
          { value: "39.5 ms", label: "one question, laya (English)", note: "Tesla T4, measured (README)", tone: "choice" },
          { value: "7.2 ms", label: "per question at 10 per call", note: "laya-multilingual, T4, batched", tone: "noul" },
          { value: "100+", label: "languages", note: "via the multilingual checkpoint", tone: "score" },
        ]}
      />

      <Callout type="warning" title="What a decision engine is not">
        <p>
          It is not a chatbot and not a reasoner. It cannot explain its answer, answer an open question, or chain
          several steps of thought. Laya's own MCP documentation says to use it “for structured decisions only”.
          It is also not a zero-shot oracle: on the typed-decisions benchmark the base checkpoints score 0.36 and
          0.35 against a 0.32 random baseline, and a fine-tuned checkpoint reaches 0.766. The README's advice is
          to treat Laya “as a fast base to specialise, not as a zero-shot decision engine”.
        </p>
      </Callout>

      <h2>Why this shape of model matters</h2>
      <p>
        Agents and production pipelines make the same small decisions again and again: guardrails before a call,
        routing between tools or models, triage of incoming work, checks on outputs. Doing each one with a
        generative model costs a full generation, a parser and a retry path. A decision engine answers in tens of
        milliseconds on a GPU, runs on your own hardware, and returns probabilities you can threshold. The price
        is flexibility: the options must be known in advance, and the model is only as good as the decisions it
        was trained or fine-tuned on.
      </p>
      <Callout type="laya">
        Laya exposes the same request shape as TypeSafe's hosted Jev API (<code>POST /v1/systemone</code>), so a
        Jev client can be pointed at a self-hosted <code>laya-serve</code>. See <Source path="laya/serve.py" />.
      </Callout>

      <h2>How this tutorial is organised</h2>
      <div className="part-map">
        {PARTS.map((part) => {
          const chapters = CHAPTERS.filter((c) => c.part === part.id);
          return (
            <div key={part.id} className="part-card">
              <div className="part-card-head">
                <span className="feature-icon" aria-hidden="true">
                  <Icon name={PART_ICONS[part.id] ?? "book"} size={16} />
                </span>
                <span className="part-card-numeral">Part {part.numeral}</span>
              </div>
              <h3>{part.title}</h3>
              <ol>
                {chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#/${c.id}`}>{c.title}</a>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <p>
        Figures are labelled by kind. <strong>Interactive</strong> figures run the same maths as Laya (the unit
        tests pin them to Laya's formulas). <strong>Simulation</strong> figures teach a mechanism with made-up or
        simplified data, and say so. <strong>Measured data</strong> figures reproduce numbers published in the
        Laya repository.
      </p>

      <KeyTakeaways
        items={[
          "A System 1 decision engine answers typed questions (choice, score, noul) about a state in one forward pass.",
          "Its output is a probability distribution over the options you supplied, never free text.",
          "It is fast and cheap enough to sit in front of, or inside, every step of a pipeline or agent.",
          "It is not a reasoner, and its base checkpoints are a starting point: most of the accuracy comes from fine-tuning on your own decisions.",
        ]}
      />
    </>
  );
}
