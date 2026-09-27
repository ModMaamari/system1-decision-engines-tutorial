import { useMemo, useState } from "react";
import { Segmented } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { Icon } from "../components/Icon";
import { route, type Checkpoint } from "../lib/lang";

const SAMPLES: { label: string; text: string }[] = [
  { label: "English ticket", text: "Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan." },
  { label: "Hindi", text: "मुझसे मार्च में दो बार शुल्क लिया गया, कृपया डुप्लिकेट राशि वापस करें।" },
  { label: "German", text: "Der Kunde wurde zweimal belastet und möchte das Geld zurück" },
  { label: "Spanish", text: "La aplicación se cierra cada vez que abro la configuración." },
  { label: "Arabic", text: "تم خصم المبلغ مرتين" },
  { label: "Japanese", text: "先月の請求が二重になっています。返金をお願いします。" },
  { label: "Short Portuguese", text: "Esqueci minha senha" },
  { label: "Romanian (a known miss)", text: "Care este ora in Tokyo?" },
  { label: "No letters", text: "#4411 — 2 × $49.00" },
];

const RUNGS: { id: string; label: string }[] = [
  { id: "model", label: "explicit model=" },
  { id: "task", label: "explicit task= (typed-decisions)" },
  { id: "workflow", label: "question ids match a typed-decisions workflow (opt-in)" },
  { id: "lang", label: "explicit lang=" },
  { id: "hint", label: "lang_guess= hint (per call, then Router-wide)" },
  { id: "detection", label: "detected script and language" },
  { id: "default", label: "default= (english unless changed)" },
];

const CKPT_LABEL: Record<Checkpoint, string> = {
  english: "laya (English)",
  multilingual: "laya-multilingual",
  "typed-decisions": "laya-typed-decisions",
};

export function RouterDemo() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [model, setModel] = useState<"auto" | Checkpoint>("auto");
  const [lang, setLang] = useState("");
  const [def, setDef] = useState<"english" | "multilingual">("english");

  const r = useMemo(
    () => route(text, { model: model === "auto" ? undefined : model, lang: lang.trim() ? lang : undefined, defaultModel: def }),
    [text, model, lang, def],
  );
  const rung = r.step === "detection" && /using default/.test(r.reason) ? "default" : r.step;
  const profile = r.detection ? Object.entries(r.detection.profile).sort((a, b) => b[1] - a[1]) : [];

  return (
    <Figure
      title="Which checkpoint reads this?"
      kind="interactive"
      wide
      caption={
        <>
          Runs a port of Laya's detector and routing rules; the reason texts are Laya's. The port leaves out the
          line-by-line and field-by-field scan the real <code>analyse</code> does for foreign passages inside
          English-looking states, so on mixed or structured inputs the library is more careful than this demo.
        </>
      }
    >
      <div className="qb-presets" role="group" aria-label="Sample states">
        {SAMPLES.map((s) => (
          <button key={s.label} type="button" className={`chip-btn ${s.text === text ? "is-on" : ""}`} onClick={() => setText(s.text)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="rd-grid">
        <div>
          <label className="field">
            <span>state</span>
            <textarea className="rd-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label="State text" />
          </label>
          <div className="rd-options">
            <div className="seq-control-group">
              <span className="seq-control-label">model=</span>
              <Segmented
                label="Explicit model"
                size="sm"
                value={model}
                onChange={setModel}
                options={[
                  { value: "auto", label: "auto" },
                  { value: "english", label: "english" },
                  { value: "multilingual", label: "multilingual" },
                  { value: "typed-decisions", label: "typed" },
                ]}
              />
            </div>
            <label className="field rd-lang">
              <span>lang=</span>
              <input value={lang} onChange={(e) => setLang(e.target.value)} placeholder="e.g. de, en_US.UTF-8, C.UTF-8" />
            </label>
            <div className="seq-control-group">
              <span className="seq-control-label">Router(default=…)</span>
              <Segmented
                label="Default checkpoint"
                size="sm"
                value={def}
                onChange={setDef}
                options={[
                  { value: "english", label: "english" },
                  { value: "multilingual", label: "multilingual" },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="rd-result">
          <div className={`rd-choice ck-${r.model}`}>
            <span className="rd-choice-label">routed to</span>
            <span className="rd-choice-model">{CKPT_LABEL[r.model]}</span>
            <code className="rd-reason">{r.reason}</code>
          </div>
          {profile.length > 0 && (
            <div className="rd-profile">
              <div className="qb-col-title">Letters by script</div>
              {profile.map(([s, f]) => (
                <div key={s} className="rd-bar">
                  <span>{s}</span>
                  <span className="rd-bar-track">
                    <span className="rd-bar-fill" style={{ width: `${f * 100}%` }} />
                  </span>
                  <span className="tabular">{Math.round(f * 100)}%</span>
                </div>
              ))}
              {r.detection?.script === "latin" && (
                <p className="rd-lang-note">
                  language guess: <b>{r.detection.language ?? "undecided"}</b> · non-English letters{" "}
                  {(r.detection.diacriticRate * 100).toFixed(1)}%
                </p>
              )}
            </div>
          )}
          <ol className="rd-ladder" aria-label="Routing precedence">
            {RUNGS.map((g) => (
              <li key={g.id} className={g.id === rung ? "is-hit" : ""}>
                {g.id === rung ? <Icon name="arrowRight" size={13} /> : <span className="rd-dot" />}
                {g.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Figure>
  );
}
