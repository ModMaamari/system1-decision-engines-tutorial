import { useState } from "react";
import { Button } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { CodeBlock } from "../components/ui/CodeBlock";
import { TypeTag } from "../components/ui/Blocks";

interface Node {
  q: string;
  options: { label: string; next: string }[];
}

interface Leaf {
  title: string;
  type?: "choice" | "score" | "noul";
  advice: string[];
  template?: string;
}

export const TREE: Record<string, Node> = {
  start: {
    q: "Can you list every acceptable answer in advance?",
    options: [
      { label: "Yes, the answers are a fixed set", next: "howMany" },
      { label: "No, the answer is free text, a number or a span", next: "leaf:notS1" },
    ],
  },
  howMany: {
    q: "For one input, how many of those answers can be true at once?",
    options: [
      { label: "Exactly one", next: "ordered" },
      { label: "Any number: they are independent properties", next: "leaf:multiNoul" },
    ],
  },
  ordered: {
    q: "Do the answers have a natural order, from low to high?",
    options: [
      { label: "Yes (severity, urgency, frustration…)", next: "leaf:score" },
      { label: "No", next: "yesno" },
    ],
  },
  yesno: {
    q: "Is it a yes/no question about the input?",
    options: [
      { label: "Yes", next: "leaf:noul" },
      { label: "No, several categories", next: "count" },
    ],
  },
  count: {
    q: "How many categories?",
    options: [
      { label: "Up to about 20", next: "leaf:choice" },
      { label: "More than 20", next: "leaf:bigChoice" },
    ],
  },
};

export const LEAVES: Record<string, Leaf> = {
  notS1: {
    title: "Not a System 1 decision",
    advice: [
      "Extraction, generation and open questions need a generative model (System 2) or a dedicated extractor.",
      "A decision engine can still help around it: decide whether extraction is needed, or check the extracted value.",
    ],
  },
  multiNoul: {
    title: "Several noul questions, one call",
    type: "noul",
    advice: [
      "Ask one yes/no question per property; they run as separate rows of the same batched call.",
      "Do not combine properties into one choice (billing_and_urgent): the combinations multiply and each loses data.",
      "Describe both sides with criteria keyed true/false.",
    ],
    template: `{
  "refund_requested": {"type": "noul", "instructions": "Does the customer ask for money back?",
                       "criteria": {"true": "asks for a refund or reversal", "false": "no refund is requested"}},
  "churn_risk":       {"type": "noul", "instructions": "Does the customer threaten to cancel or leave?",
                       "criteria": {"true": "mentions cancelling, leaving or a competitor", "false": "no such signal"}}
}`,
  },
  score: {
    title: "A score question",
    type: "score",
    advice: [
      "List the levels from 0 upwards and describe every one; the answer is the expected level Σ i·pᵢ.",
      "Take the argmax of the probabilities if you need a single level.",
      "Score is Laya's weakest primitive, and the multilingual checkpoint rarely picks level 0: route English score questions to English and validate.",
    ],
    template: `{
  "urgency": {"type": "score", "instructions": "How urgent is the request in \`body\`?",
              "criteria": ["no time pressure", "needs attention soon", "blocking issue or hard deadline"]}
}`,
  },
  noul: {
    title: "A noul question",
    type: "noul",
    advice: [
      "The answer is P(true). Describe the true and false cases in criteria; without them the English checkpoint may answer from the generic wording alone.",
      "If the model follows the words false/true instead of the input, override them with labels (A/B) and validate.",
    ],
    template: `{
  "is_phishing": {"type": "noul",
                  "instructions": "Is this email a phishing or scam attempt to steal money, credentials, or personal data?",
                  "criteria": {"true": "phishing, scam, or fraud", "false": "a legitimate email"}}
}`,
  },
  choice: {
    title: "A choice question",
    type: "choice",
    advice: [
      "Give every label a description; the model matches the input against the descriptions.",
      "Use semantic or opaque labels, never yes/no or true/false.",
      "Include an “other” option: the model must pick one of the labels, so give it an honest way out.",
      "Test negated phrasings of your labels (“I do not want to cancel”).",
    ],
    template: `{
  "department": {"type": "choice", "instructions": "Which department should handle this request?",
                 "criteria": {"billing": "invoices, payments, refunds",
                              "technical": "bugs, outages, system errors",
                              "sales": "pricing, new contracts",
                              "other": "everything else"}}
}`,
  },
  bigChoice: {
    title: "A large choice: shortlist or split",
    type: "choice",
    advice: [
      "All options share head_max_len; past about 20 they lose their distinguishing tokens (Banking77: 0.425).",
      "Shortlist with predict_shortlist (embedding similarity, top k), or ask a coarse question first and a fine one second.",
      "Or widen head_max_len (and max_len) per call, and measure the trade-off: it leaves less room for the state.",
    ],
    template: `# two levels instead of 77 options
coarse = {"area": {"type": "choice", "instructions": "What is this banking request about?",
                   "criteria": {"card": "physical or virtual cards", "transfer": "sending or receiving money",
                                "top_up": "adding money", "account": "identity, details, closing", "other": "anything else"}}}
# then ask a fine question with only the labels of the chosen area`,
  },
};

export function DesignWizard() {
  const [path, setPath] = useState<string[]>(["start"]);
  const current = path[path.length - 1];
  const leaf = current.startsWith("leaf:") ? LEAVES[current.slice(5)] : null;
  const node = leaf ? null : TREE[current];

  return (
    <Figure
      title="Decision design wizard"
      kind="interactive"
      actions={
        path.length > 1 ? (
          <Button size="sm" icon="reset" onClick={() => setPath(["start"])}>
            Start over
          </Button>
        ) : undefined
      }
      caption="Answer a few questions about the decision you want to automate; the recommendation follows Laya's documented guidance and limits."
    >
      <ol className="dw-trail">
        {path.slice(0, -1).map((p, i) => {
          const n = TREE[p];
          const chosen = n.options.find((o) => o.next === path[i + 1]);
          return (
            <li key={p}>
              <span className="muted">{n.q}</span> <b>{chosen?.label}</b>
            </li>
          );
        })}
      </ol>
      {node && (
        <div className="dw-node">
          <p className="dw-q">{node.q}</p>
          <div className="dw-options">
            {node.options.map((o) => (
              <button key={o.label} type="button" className="dw-option" onClick={() => setPath([...path, o.next])}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {leaf && (
        <div className="dw-leaf" role="status">
          <h3 className="dw-title">
            {leaf.type && <TypeTag type={leaf.type} />} {leaf.title}
          </h3>
          <ul>
            {leaf.advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {leaf.template && <CodeBlock lang={leaf.template.startsWith("#") ? "python" : "json"} code={leaf.template} title="Template" />}
        </div>
      )}
    </Figure>
  );
}
