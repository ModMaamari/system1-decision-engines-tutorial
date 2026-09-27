import { useMemo, useState } from "react";
import { Segmented, Slider } from "../components/ui/Controls";
import { Figure } from "../components/ui/Figure";
import { Icon } from "../components/Icon";
import { buildSequence, type Tok } from "../lib/sequence";
import type { QuestionDef } from "../lib/questions";

const BANKING = [
  "activate_my_card", "age_limit", "apple_pay_or_google_pay", "atm_support", "automatic_top_up", "balance_not_updated_after_bank_transfer",
  "balance_not_updated_after_cheque_or_cash_deposit", "beneficiary_not_allowed", "cancel_transfer", "card_about_to_expire", "card_acceptance",
  "card_arrival", "card_delivery_estimate", "card_linking", "card_not_working", "card_payment_fee_charged", "card_payment_not_recognised",
  "card_payment_wrong_exchange_rate", "card_swallowed", "cash_withdrawal_charge", "cash_withdrawal_not_recognised", "change_pin",
  "compromised_card", "contactless_not_working", "country_support", "declined_card_payment", "declined_cash_withdrawal", "declined_transfer",
  "direct_debit_payment_not_recognised", "disposable_card_limits", "edit_personal_details", "exchange_charge", "exchange_rate",
  "exchange_via_app", "extra_charge_on_statement", "failed_transfer", "fiat_currency_support", "get_disposable_virtual_card",
  "get_physical_card", "getting_spare_card", "getting_virtual_card", "lost_or_stolen_card", "lost_or_stolen_phone", "order_physical_card",
  "passcode_forgotten", "pending_card_payment", "pending_cash_withdrawal", "pending_top_up", "pending_transfer", "pin_blocked",
  "receiving_money", "Refund_not_showing_up", "request_refund", "reverted_card_payment?", "supported_cards_and_currencies",
  "terminate_account", "top_up_by_bank_transfer_charge", "top_up_by_card_charge", "top_up_by_cash_or_cheque", "top_up_failed",
  "top_up_limits", "top_up_reverted", "topping_up_by_card", "transaction_charged_twice", "transfer_fee_charged", "transfer_into_account",
  "transfer_not_received_by_recipient", "transfer_timing", "unable_to_verify_identity", "verify_my_identity", "verify_source_of_funds",
  "verify_top_up", "virtual_card_not_working", "visa_or_mastercard", "why_verify_identity", "wrong_amount_of_cash_received",
  "wrong_exchange_rate_for_cash_withdrawal",
];

const QUESTIONS: Record<string, { label: string; q: QuestionDef }> = {
  department: {
    label: "4 options",
    q: {
      type: "choice",
      instructions: "Which department should handle this request?",
      criteria: {
        billing: "invoices, payments, refunds",
        technical: "bugs, outages, system errors",
        sales: "pricing, new contracts",
        other: "everything else",
      },
    },
  },
  triage: {
    label: "6 options",
    q: {
      type: "choice",
      instructions: "What does the customer want in `message`?",
      criteria: {
        refund: "money returned or a duplicate charge reversed",
        technical_help: "a bug, outage or integration problem",
        billing_question: "a question about an invoice, plan or payment method",
        information: "general information, pricing or how-to",
        cancellation: "wants to cancel or downgrade",
        other: "none of the other options fits",
      },
    },
  },
  banking: {
    label: "77 labels",
    q: { type: "choice", instructions: "Which banking intent is this?", criteria: BANKING },
  },
};

const SHORT = "Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan.";
const LONG = Array.from({ length: 18 }, (_, i) =>
  i === 13
    ? "Separately, I noticed the March invoice shows the annual plan charged twice on the same day, and I would like the duplicate refunded."
    : "Thanks for the quick call yesterday. As discussed, our team is rolling out the new dashboard to the regional offices next week, and we will share the training schedule with everyone once it is final. Let me know if the onboarding materials need any changes before then.",
).join(" ");

const STATES: Record<string, { label: string; text: string }> = {
  short: { label: "Short ticket", text: SHORT },
  long: { label: "Long email", text: LONG },
};

const ROLE_LABEL: Record<string, string> = {
  head: "question",
  opt: "options",
  state: "state (read)",
  dropped: "state (cut off)",
};

function chipClass(t: Tok) {
  return `tok tok-${t.role}`;
}

export function SequenceViz() {
  const [qid, setQid] = useState("department");
  const [sid, setSid] = useState("short");
  const [maxLen, setMaxLen] = useState(512);
  const [headMaxLen, setHeadMaxLen] = useState(192);

  const question = QUESTIONS[qid].q;
  const state = STATES[sid].text;
  const { tokens, stats } = useMemo(() => buildSequence({ question, state, maxLen, headMaxLen }), [question, state, maxLen, headMaxLen]);

  const dropped = stats.stateTokensFull - stats.stateTokens;
  const specials = tokens.filter((t) => t.role === "cls" || t.role === "sep").length;
  const segments = [
    { key: "head", n: stats.headTokens },
    { key: "opt", n: stats.optionTokens },
    { key: "state", n: stats.stateTokens },
    { key: "dropped", n: dropped },
  ];
  const total = segments.reduce((a, s) => a + s.n, 0) + specials;

  // Show every token of the head, and elide the middle of long states.
  const shown: (Tok | { gap: number })[] = [];
  const stateIdx = tokens.map((t, i) => (t.role === "state" ? i : -1)).filter((i) => i >= 0);
  const optIdx = tokens.map((t, i) => (t.role === "opt" || t.role === "mask" ? i : -1)).filter((i) => i >= 0);
  const keep = new Set<number>();
  tokens.forEach((t, i) => {
    if (t.role !== "state" && t.role !== "opt" && t.role !== "mask") keep.add(i);
  });
  (optIdx.length > 160 ? [...optIdx.slice(0, 100), ...optIdx.slice(-20)] : optIdx).forEach((i) => keep.add(i));
  (stateIdx.length > 90 ? [...stateIdx.slice(0, 60), ...stateIdx.slice(-12)] : stateIdx).forEach((i) => keep.add(i));
  let skipped = 0;
  tokens.forEach((t, i) => {
    if (keep.has(i)) {
      if (skipped) shown.push({ gap: skipped });
      skipped = 0;
      shown.push(t);
    } else skipped++;
  });

  const collapsed = stats.options - stats.optionsDistinct;

  return (
    <Figure
      title="One question row, token by token"
      kind="interactive"
      wide
      caption={
        <>
          Budget rules are ported exactly from Laya's <code>build_sequence</code>. Token boundaries come from a simple
          approximation, not the checkpoint's BPE tokenizer, so exact counts differ; the behaviour at the limits is
          the same. The long email hides its one refund request in sentence 14 of 18.
        </>
      }
    >
      <div className="seq-controls">
        <div className="seq-control-group">
          <span className="seq-control-label">Question</span>
          <Segmented label="Question" size="sm" value={qid} onChange={setQid} options={Object.entries(QUESTIONS).map(([k, v]) => ({ value: k, label: v.label }))} />
        </div>
        <div className="seq-control-group">
          <span className="seq-control-label">State</span>
          <Segmented label="State" size="sm" value={sid} onChange={setSid} options={Object.entries(STATES).map(([k, v]) => ({ value: k, label: v.label }))} />
        </div>
        <div className="control-grid seq-sliders">
          <Slider label="max_len" value={maxLen} min={128} max={2048} step={64} onChange={(v) => { setMaxLen(v); if (headMaxLen > v - 32) setHeadMaxLen(Math.max(64, v - 64)); }} hint="whole row; 512 English, 1,024 others" />
          <Slider label="head_max_len" value={headMaxLen} min={64} max={Math.min(768, maxLen - 32)} step={16} onChange={setHeadMaxLen} hint="question + options; 192 English, 256 others" accent="var(--choice)" />
        </div>
      </div>

      <div className="seq-bar" role="img" aria-label={`Token budget: ${stats.headTokens} question, ${stats.optionTokens} option, ${stats.stateTokens} state tokens read, ${dropped} state tokens cut off`}>
        {segments.map((s) =>
          s.n > 0 ? (
            <div key={s.key} className={`seq-seg seg-${s.key}`} style={{ flexGrow: s.n }} title={`${ROLE_LABEL[s.key]}: ${s.n}`} />
          ) : null,
        )}
      </div>
      <div className="seq-legend">
        {segments.map((s) => (
          <span key={s.key}>
            <i className={`seq-swatch seg-${s.key}`} /> {ROLE_LABEL[s.key]} <b className="tabular">{s.n}</b>
          </span>
        ))}
        <span className="muted">
          {total - dropped} of max_len {maxLen} used
        </span>
      </div>

      <div className="seq-stats">
        <div className={`seq-stat ${stats.tokensPerOption ? "is-warn" : ""}`}>
          <span className="seq-stat-v tabular">{stats.tokensPerOption ?? "≤ 48"}</span>
          <span className="seq-stat-l">tokens per option{stats.tokensPerOption ? " (trimmed)" : " (cap)"}</span>
        </div>
        <div className={`seq-stat ${collapsed ? "is-bad" : ""}`}>
          <span className="seq-stat-v tabular">
            {stats.optionsDistinct}/{stats.options}
          </span>
          <span className="seq-stat-l">options still distinct</span>
        </div>
        <div className={`seq-stat ${stats.headTokens < stats.headTokensFull ? "is-warn" : ""}`}>
          <span className="seq-stat-v tabular">
            {stats.headTokens}/{stats.headTokensFull}
          </span>
          <span className="seq-stat-l">question tokens kept</span>
        </div>
        <div className={`seq-stat ${dropped ? "is-bad" : ""}`}>
          <span className="seq-stat-v tabular">{Math.round((stats.stateTokens / Math.max(1, stats.stateTokensFull)) * 100)}%</span>
          <span className="seq-stat-l">of the state read</span>
        </div>
      </div>

      {(collapsed > 0 || dropped > 0 || stats.tokensPerOption) && (
        <ul className="seq-alerts">
          {stats.tokensPerOption && (
            <li>
              <Icon name="alert" size={15} />
              <span>
                The options overflowed head_max_len, so each was cut to {stats.tokensPerOption} tokens, the [MASK] marker included.
              </span>
            </li>
          )}
          {collapsed > 0 && (
            <li>
              <Icon name="alert" size={15} />
              <span>
                {collapsed} option{collapsed > 1 ? "s" : ""} now share a token span with another: the model cannot tell them apart.
                Laya reports this in <code>usage["options"]</code>.
              </span>
            </li>
          )}
          {dropped > 0 && (
            <li>
              <Icon name="alert" size={15} />
              <span>
                {dropped} state tokens never reach the model. Raise max_len (the multilingual checkpoint reads up to 8,192) or scan
                the document with <code>predict_long</code>.
              </span>
            </li>
          )}
        </ul>
      )}

      <div className="seq-tokens" aria-label="Tokens of the row">
        {shown.map((t, i) =>
          "gap" in t ? (
            <span key={`g${i}`} className="tok tok-gap">
              … {t.gap} more …
            </span>
          ) : (
            <span key={i} className={chipClass(t)}>
              {t.text.replace(/^\s+/, "·")}
            </span>
          ),
        )}
      </div>
    </Figure>
  );
}
