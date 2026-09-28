import {Circle, Gradient, Grid, Layout, Node, Rect, Txt, type View2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  linear,
  useThread,
  waitFor,
  type ThreadGenerator,
} from '@motion-canvas/core';
import {C, FONT, H, MONO, W, alpha} from './theme';
import {at, FPS, SCENES, TOTAL, type SceneTiming} from './timing';

export type NoteKind = 'measured' | 'illustrative' | 'diagram' | 'formula' | 'source';

const NOTE_LABEL: Record<NoteKind, [string, string]> = {
  measured: ['MEASURED DATA', C.s1],
  illustrative: ['ILLUSTRATIVE', C.score],
  diagram: ['DIAGRAM', C.choice],
  formula: ['FORMULA', C.noul],
  source: ['SOURCE', C.text2],
};

export interface Stage {
  /** Layer for the scene's own content, between the backdrop and the HUD. */
  content: Node;
  /** The HUD (brand, part label, counter, progress bar). */
  hud: Node;
  /** Starts the background animation (backdrop drift, progress bar). Spawn it with `yield`. */
  run(): ThreadGenerator;
  /** Shows a source or kind tag in the bottom-left corner. */
  note(kind: NoteKind, text: string): ThreadGenerator;
  hideNote(): ThreadGenerator;
  /** Animates the content out just before the scene ends, then holds to the exact end. */
  finish(opts?: {fadeToBlack?: boolean}): ThreadGenerator;
}

type Timing = SceneTiming & {index: number; previous?: SceneTiming};

/**
 * Sets up the shared backdrop and HUD. Every scene builds an identical copy that depends only
 * on the global time, so cutting from one scene to the next is seamless.
 */
export function setupStage(view: View2D, T: Timing): Stage {
  view.fill(C.bg);
  const g = createSignal(T.start); // global time, in seconds

  const orb = (color: string, a: number, r: number, x: () => number, y: () => number) => (
    <Circle
      size={r * 2}
      x={x}
      y={y}
      fill={
        new Gradient({
          type: 'radial',
          fromRadius: 0,
          toRadius: r,
          stops: [
            {offset: 0, color: alpha(color, a)},
            {offset: 0.45, color: alpha(color, a * 0.45)},
            {offset: 1, color: alpha(color, 0)},
          ],
        })
      }
    />
  );

  view.add(
    <Node>
      <Rect
        width={W}
        height={H}
        fill={
          new Gradient({
            fromY: -H / 2,
            toY: H / 2,
            stops: [
              {offset: 0, color: C.bgTop},
              {offset: 1, color: C.bgBottom},
            ],
          })
        }
      />
      {orb(C.s1Deep, 0.34, 820, () => -560 + 190 * Math.sin(g() * 0.11), () => -250 + 120 * Math.cos(g() * 0.09))}
      {orb('#6d28d9', 0.3, 900, () => 640 + 210 * Math.cos(g() * 0.08), () => 280 + 140 * Math.sin(g() * 0.12))}
      {orb('#1d4ed8', 0.22, 700, () => 160 * Math.sin(g() * 0.06 + 2), () => 560 + 60 * Math.cos(g() * 0.1))}
      <Grid width={W} height={H} spacing={64} stroke={alpha('#94a3b8', 0.045)} lineWidth={1} />
      <Rect
        width={W}
        height={H}
        fill={
          new Gradient({
            type: 'radial',
            fromRadius: 0,
            toRadius: 1150,
            stops: [
              {offset: 0, color: 'rgba(2,4,10,0)'},
              {offset: 0.55, color: 'rgba(2,4,10,0.08)'},
              {offset: 1, color: 'rgba(2,4,10,0.7)'},
            ],
          })
        }
      />
    </Node>,
  );

  const content = createRef<Node>();
  view.add(<Node ref={content} />);

  // ---- HUD ------------------------------------------------------------------------------
  const hud = createRef<Node>();
  const part = createRef<Txt>();
  const partSlash = createRef<Txt>();
  const noteTag = createRef<Rect>();
  const noteTagText = createRef<Txt>();
  const noteText = createRef<Txt>();
  const noteNode = createRef<Node>();
  const previousPart = T.previous?.part ?? '';
  const partLabel = (p: string) => (p ? p.toUpperCase() : '');
  const left = -W / 2 + 72;
  const top = -H / 2 + 56;

  view.add(
    <Node ref={hud}>
      <Layout x={left} y={top} offsetX={-1} layout direction="row" alignItems="center" gap={14}>
        <Rect width={22} height={22} radius={6} fill={C.s1Deep}>
          <Circle layout={false} x={4} size={7} fill="#ecfeff" />
          <Rect layout={false} x={-4} width={6} height={2.4} radius={1.2} fill="#ecfeff" />
        </Rect>
        <Txt text="SYSTEM 1 DECISION ENGINES" fontFamily={FONT} fontWeight={650} fontSize={15} letterSpacing={3} fill={C.text2} />
        <Txt ref={partSlash} text="/" fontFamily={FONT} fontSize={15} fill={C.text3} opacity={previousPart ? 1 : 0} />
        <Txt
          ref={part}
          text={partLabel(previousPart)}
          fontFamily={FONT}
          fontWeight={650}
          fontSize={15}
          letterSpacing={3}
          fill={C.s1}
        />
      </Layout>
      <Txt
        x={W / 2 - 72}
        y={top}
        offsetX={1}
        text={`${String(T.index + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`}
        fontFamily={MONO}
        fontSize={15}
        fill={C.text3}
      />
      {/* progress */}
      <Rect x={0} y={H / 2 - 2} width={W} height={4} fill={alpha('#94a3b8', 0.08)} />
      <Rect
        x={-W / 2}
        y={H / 2 - 2}
        offsetX={-1}
        height={4}
        width={() => (g() / TOTAL) * W}
        fill={
          new Gradient({
            fromX: 0,
            toX: W,
            stops: [
              {offset: 0, color: C.s1Deep},
              {offset: 1, color: C.s1Strong},
            ],
          })
        }
      />
      {SCENES.slice(1).map((s) => (
        <Rect x={-W / 2 + (s.start / TOTAL) * W} y={H / 2 - 5} width={2} height={10} fill={alpha('#cbd5e1', 0.25)} />
      ))}
      <Node ref={noteNode} opacity={0}>
        <Rect
          ref={noteTag}
          x={left}
          y={H / 2 - 42}
          offsetX={-1}
          height={28}
          radius={14}
          padding={[0, 12]}
          layout
          alignItems="center"
          fill={alpha(C.s1, 0.12)}
          stroke={alpha(C.s1, 0.4)}
          lineWidth={1}
        >
          <Txt ref={noteTagText} text="" fontFamily={FONT} fontWeight={700} fontSize={12} letterSpacing={2} fill={C.s1} />
        </Rect>
        <Txt ref={noteText} x={left} y={H / 2 - 42} offsetX={-1} text="" fontFamily={FONT} fontSize={16} fill={C.text3} />
      </Node>
    </Node>,
  );

  const nextPart = partLabel(T.part);

  return {
    content: content(),
    hud: hud(),
    *run() {
      const tasks: ThreadGenerator[] = [g(T.start + T.duration, T.duration, linear)];
      if (nextPart !== partLabel(previousPart)) {
        tasks.push(
          (function* () {
            yield* waitFor(0.15);
            yield* part().opacity(0, 0.25);
            part().text(nextPart);
            partSlash().opacity(nextPart ? 1 : 0);
            yield* part().opacity(1, 0.45, easeOutCubic);
          })(),
        );
      }
      yield* all(...tasks);
    },
    *note(kind, text) {
      const [label, color] = NOTE_LABEL[kind];
      if (noteNode().opacity() > 0) yield* noteNode().opacity(0, 0.25);
      noteTagText().text(label);
      noteTagText().fill(color);
      noteTag().fill(alpha(color, 0.12));
      noteTag().stroke(alpha(color, 0.4));
      noteText().text(text);
      noteText().x(left + noteTag().width() + 14);
      yield* noteNode().opacity(1, 0.5, easeOutCubic);
    },
    *hideNote() {
      yield* noteNode().opacity(0, 0.35);
    },
    *finish(opts = {}) {
      const end = T.duration;
      if (opts.fadeToBlack) {
        const black = createRef<Rect>();
        view.add(<Rect ref={black} width={W} height={H} fill="#000" opacity={0} />);
        yield* at(end - 1.6);
        yield* black().opacity(1, 1.5, easeInOutCubic);
      } else {
        yield* at(end - 0.6);
        yield* all(
          content().opacity(0, 0.5, easeInCubic),
          content().scale(0.985, 0.5, easeInCubic),
          noteNode().opacity(0, 0.4),
        );
      }
      yield* at(end);
      // waitFor() can stop a frame early, depending on rounding. Hold until the scene has run for
      // exactly its planned number of frames, so the video never drifts from the narration.
      while (Math.round(useThread().fixed * FPS) < T.frames) yield;
    },
  };
}
