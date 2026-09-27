import { Suspense, type ReactNode } from "react";
import { CHAPTERS, chapterIndex, getPart, type Chapter } from "../../content/chapters";
import { Icon } from "../Icon";

interface ChapterViewProps {
  chapter: Chapter;
  footer?: ReactNode;
}

export function ChapterView({ chapter, footer }: ChapterViewProps) {
  const index = chapterIndex(chapter.id);
  const part = getPart(chapter.part);
  const { Component } = chapter;

  return (
    <article className="chapter" aria-labelledby="chapter-title">
      <header className="chapter-header">
        <div className="chapter-eyebrow">
          <span>
            Part {part.numeral} · {part.title}
          </span>
          <span className="dot" aria-hidden="true">
            •
          </span>
          <span>
            Chapter {index + 1} of {CHAPTERS.length}
          </span>
          <span className="dot" aria-hidden="true">
            •
          </span>
          <span className="reading-time">
            <Icon name="clock" size={14} /> {chapter.minutes} min
          </span>
        </div>
        <h1 id="chapter-title">{chapter.title}</h1>
        <p className="chapter-summary">{chapter.summary}</p>
      </header>
      <div className="chapter-body">
        <Suspense fallback={<div className="chapter-loading" role="status">Loading chapter…</div>}>
          <Component />
        </Suspense>
      </div>
      {footer}
    </article>
  );
}
