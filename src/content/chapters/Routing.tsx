import { BarChart } from "../../components/charts/BarChart";
import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Figure } from "../../components/ui/Figure";
import { KeyTakeaways, Lead, Source, StatGrid, TableWrap } from "../../components/ui/Blocks";
import { CHECKPOINTS, ROUTING_EVIDENCE } from "../../data/laya";
import { RouterDemo } from "../../figures/RouterDemo";

const ROUTER = `from laya import Router

router = Router()                        # lazy: builds a checkpoint on first use
res = router.predict(state, questions)   # detects script/language, picks a checkpoint, runs it
res["routing"]
# {'model': 'multilingual', 'repo': 'convaiinnovations/laya/multilingual',
#  'reason': 'non-Latin script (devanagari, 100% of letters); the English checkpoint cannot read it'}

router.route({"body": "Der Kunde wurde zweimal belastet"}, questions).reason   # no forward pass
# "Latin script but language looks like 'de', not English"`;

const HINTS = `router = Router(default="multilingual")            # most traffic is not English
router.predict(state, questions, lang_guess="ro")   # a code you already know
router.predict(state, questions, lang_guess=lambda s: my_lid(s))   # e.g. fastText or CLD3
router = Router(preload=True, lang_guess=my_lid)    # one hint for every request
router.predict(state, questions, model="typed-decisions")   # or pin a checkpoint`;

const PRELOAD = `router = Router(preload=True, device="cuda")   # every checkpoint resident
router.preload(["english", "multilingual"])    # or only the ones you serve
router.attach("english", existing_agent)       # reuse an agent you already built
router = Router(max_loaded=3)                  # keep all three hot (auto task detection)
router.unload()                                # free memory`;

export default function Routing() {
  return (
    <>
      <Lead>
        Laya ships three checkpoints rather than one, because no single encoder is best at everything. The{" "}
        <code>Router</code> picks one per request, before any forward pass, in well under a millisecond. This chapter
        explains why that decision cannot be left to the model, and how the router makes it.
      </Lead>

      <h2>The three checkpoints</h2>
      <TableWrap caption="From the README. All three live in the convaiinnovations/laya repository (as the root and two subfolders) and in standalone repositories.">
        <table>
          <thead>
            <tr>
              <th scope="col">Checkpoint</th>
              <th scope="col">Encoder</th>
              <th scope="col" className="num">
                Params
              </th>
              <th scope="col">Context (max_len)</th>
              <th scope="col" className="num">
                head_max_len
              </th>
              <th scope="col">Use it for</th>
            </tr>
          </thead>
          <tbody>
            {CHECKPOINTS.map((c) => (
              <tr key={c.id}>
                <td>
                  <code>{c.name}</code>
                </td>
                <td>{c.encoder}</td>
                <td className="num">{c.params}</td>
                <td>{c.context}</td>
                <td className="num">{c.headMaxLen}</td>
                <td>{c.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <h2>Why route at all</h2>
      <Figure
        title="Accuracy by language family, same questions, both checkpoints"
        kind="data"
        caption="From the README's “Why Route: The Evidence” (17,416 questions on one T4, byte-identical questions per model). MASSIVE intent has 20 options (random = 0.05); XNLI has 3."
      >
        <BarChart
          ariaLabel="Accuracy of the English and multilingual checkpoints on English and non-English tasks"
          valueLabel="Task"
          domain={[0, 1]}
          highlightMax
          series={[
            { id: "english", label: "laya (English)", color: "var(--viz-choice)" },
            { id: "multilingual", label: "laya-multilingual", color: "var(--viz-accent)" },
          ]}
          rows={ROUTING_EVIDENCE.map((r) => ({ label: r.task, values: { english: r.english, multilingual: r.multilingual } }))}
          labelWidth={230}
        />
      </Figure>
      <p>
        The English checkpoint is better on English; the multilingual one is far better elsewhere. The router takes the
        better of the two in each case, which on the 51-language MASSIVE sweep raises the number of languages above
        three times random from 23 to 45. The English checkpoint does not degrade gently: on 20-option intent it scores
        0.100 on Hindi and 0.103 on Korean (random is 0.050), with an ECE of 0.855 on Hindi, and 0.000 on Khmer at 0.952
        confidence. Because its confidence gives no warning, the choice has to be made from the input, not from the
        output.
      </p>
      <StatGrid
        items={[
          { value: "23 → 45", label: "of 51 languages usable", note: "above 3× random, English vs routed" },
          { value: "< 0.5 ms", label: "script detection", note: "pure Python, before the forward pass", tone: "choice" },
          { value: "≈ 2×", label: "multilingual speed at 10 questions", note: "72.3 ms vs 158.6 ms on a T4 (1 question: 32.8 vs 39.5 ms)", tone: "noul" },
        ]}
      />

      <h2>How the router decides</h2>
      <p>
        The router asks one question: <em>can the English checkpoint read this state?</em> It checks the following in
        order, and the first one that gives an answer wins:
      </p>
      <ol>
        <li>
          An explicit <code>model=</code>, then an explicit <code>task=</code>.
        </li>
        <li>
          If <code>auto_task_detection=True</code>: question ids that exactly match one of the four typed-decisions
          workflows route to <code>laya-typed-decisions</code>. It is never chosen silently otherwise, because it is
          fine-tuned on four specific synthetic workflows.
        </li>
        <li>
          An explicit <code>lang=</code>, then a <code>lang_guess=</code> hint (per call, then the Router-wide one). A
          hint only decides “English or not”; codes like <code>C.UTF-8</code>, <code>und</code> or <code>mul</code>{" "}
          abstain, and <code>en_US.UTF-8</code> counts as English, so <code>$LANG</code> can be passed straight in.
        </li>
        <li>
          Detection. The <strong>script</strong> is exact: letters are counted over Unicode blocks, and any non-Latin
          script routes to multilingual. For <strong>Latin</strong> text, a function-word heuristic guesses the
          language, and letters that English does not use (é, ł, ș, …) count as non-English evidence. Structured states
          are also checked field by field and line by line, so a Portuguese message under an English stack trace is
          not sent to the English checkpoint.
        </li>
        <li>
          When nothing identifies the language (short, content-only text such as “Esqueci minha senha”), the{" "}
          <code>default</code> applies: English unless you set <code>Router(default="multilingual")</code>.
        </li>
      </ol>

      <RouterDemo />

      <CodeBlock code={ROUTER} title="Python · routing metadata comes back with every result" />

      <Callout type="warning" title="The heuristic is best-effort for Latin-script languages">
        Short Latin text in a language without a word list can carry no usable signal: the README's own example,
        Romanian “Care este ora in Tokyo?”, is read as English. If you already run a language-identification model, pass
        its answer as <code>lang_guess</code>; if most of your traffic is not English, change the default.
      </Callout>
      <CodeBlock code={HINTS} title="Python · steering the router" />

      <h2>Memory, preloading and batches</h2>
      <p>
        Building a checkpoint costs seconds (the README measured a 7.4 s median reload on CPU and 10.3 s on a T4);
        detection costs microseconds. By default the router is lazy and keeps two checkpoints resident, English and
        multilingual, evicting the least recently used. With <code>max_loaded=1</code>, every language switch
        rebuilds a checkpoint. For a server, preload.
      </p>
      <CodeBlock code={PRELOAD} title="Python · residency" />
      <TableWrap caption="From the README's “Production Preload & Memory”.">
        <table>
          <thead>
            <tr>
              <th scope="col">Deployment mode</th>
              <th scope="col">Per-request latency</th>
              <th scope="col">Model reloads</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>Router()</code> (lazy, max_loaded=2)
              </td>
              <td>detection only (&lt;1 ms) on a switch, after each language's first load</td>
              <td>1 the first time a language appears</td>
            </tr>
            <tr>
              <td>
                <code>Router(max_loaded=1)</code>
              </td>
              <td>7 to 10 s on every language switch</td>
              <td>1 per switch</td>
            </tr>
            <tr>
              <td>
                <code>Router(preload=True)</code>
              </td>
              <td>32.8 ms (GPU) / 193–464 ms (CPU)</td>
              <td>none</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>
      <p>
        For mixed workloads, <code>Router.predict_batch</code> routes every request first, groups them by checkpoint and
        by question schema, runs each group through shared forward passes, and returns results in the original order.{" "}
        <code>route_batch</code> gives just the routing decisions without loading anything.{" "}
        <Source path="laya/router.py" />
      </p>

      <KeyTakeaways
        items={[
          "laya (ModernBERT-large) for English, laya-multilingual (mmBERT-base) for 100+ languages and speed, laya-typed-decisions for its four fine-tuned workflows.",
          "Routing must happen before the forward pass: the English checkpoint is confidently wrong on scripts it cannot read.",
          "Precedence: model > task > (opt-in) workflow match > lang > lang_guess > detection > default.",
          "Script detection is exact; the Latin language guess is a heuristic, so pass a lang_guess or change the default when you know better.",
          "Preload checkpoints on servers; use predict_batch to group mixed traffic by checkpoint.",
        ]}
      />
    </>
  );
}
