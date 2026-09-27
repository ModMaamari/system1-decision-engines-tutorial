import { useState } from "react";
import { Button } from "../../components/ui/Controls";
import { Icon } from "../../components/Icon";
import { Lead } from "../../components/ui/Blocks";
import { readStored, writeStored } from "../../lib/storage";
import { CHAPTERS } from "../chapters";
import { QUIZ } from "../quiz";

export default function Quiz() {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [best, setBest] = useState<number>(() => readStored("quiz-best", 0));
  const answered = Object.keys(picks).length;
  const score = Object.entries(picks).filter(([i, p]) => QUIZ[Number(i)].answer === p).length;
  const done = answered === QUIZ.length;

  const pick = (i: number, o: number) => {
    if (picks[i] !== undefined) return;
    const next = { ...picks, [i]: o };
    setPicks(next);
    if (Object.keys(next).length === QUIZ.length) {
      const s = Object.entries(next).filter(([k, p]) => QUIZ[Number(k)].answer === p).length;
      if (s > best) {
        setBest(s);
        writeStored("quiz-best", s);
      }
    }
  };

  return (
    <>
      <Lead>
        {QUIZ.length} questions across the whole tutorial. Each answer locks in when you pick it and comes with an
        explanation and a link back to the chapter that covers it.
      </Lead>

      <div className="quiz-score" aria-live="polite">
        <span>
          <b className="tabular">{score}</b> / {answered} correct · {QUIZ.length - answered} to go
        </span>
        {best > 0 && <span className="muted">best: {best}/{QUIZ.length}</span>}
        {answered > 0 && (
          <Button size="sm" icon="reset" onClick={() => setPicks({})}>
            Start again
          </Button>
        )}
      </div>

      <ol className="quiz">
        {QUIZ.map((item, i) => {
          const picked = picks[i];
          const chapter = CHAPTERS.find((c) => c.id === item.chapter);
          return (
            <li key={i} className="quiz-item">
              <p className="quiz-q">{item.q}</p>
              <div className="quiz-options" role="group" aria-label={`Question ${i + 1} options`}>
                {item.options.map((o, j) => {
                  const state =
                    picked === undefined ? "" : j === item.answer ? "is-correct" : j === picked ? "is-wrong" : "is-dim";
                  return (
                    <button
                      key={j}
                      type="button"
                      className={`quiz-option ${state}`}
                      onClick={() => pick(i, j)}
                      disabled={picked !== undefined}
                      aria-pressed={picked === j}
                    >
                      <span className="quiz-letter">{String.fromCharCode(65 + j)}</span>
                      <span>{o}</span>
                      {picked !== undefined && j === item.answer && <Icon name="check" size={16} />}
                    </button>
                  );
                })}
              </div>
              {picked !== undefined && (
                <div className={`quiz-why ${picked === item.answer ? "ok" : "no"}`}>
                  <strong>{picked === item.answer ? "Correct. " : "Not quite. "}</strong>
                  {item.why}{" "}
                  {chapter && (
                    <a href={`#/${chapter.id}`} className="quiz-link">
                      Review: {chapter.title}
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {done && (
        <div className="quiz-final" role="status">
          <h2>
            {score} of {QUIZ.length}
          </h2>
          <p>
            {score === QUIZ.length
              ? "A perfect score. You know how System 1 decision engines work, how they are trained and calibrated, and where they fit."
              : score >= QUIZ.length * 0.75
                ? "A strong result. Follow the review links for the ones you missed."
                : "Worth another pass: follow the review links above, then try again."}
          </p>
        </div>
      )}
    </>
  );
}
