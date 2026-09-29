import {Circle, Layout, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  linear,
  loop,
  sequence,
  useRandom,
  waitFor,
  type Reference,
} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, Tag, draw, pop, rise, travel} from '../lib/ui';

function systemOrb(x: number, color: string, name: string, sub: string, ring: Reference<Circle>, node: Reference<Node>) {
  return (
    <Node ref={node} x={x} y={-10} opacity={0}>
      <Circle size={400} fill={alpha(color, 0.07)} stroke={alpha(color, 0.35)} lineWidth={2} shadowColor={alpha(color, 0.5)} shadowBlur={60} />
      <Circle ref={ring} size={460} stroke={alpha(color, 0.7)} lineWidth={3} lineDash={[18, 22]} />
      <Txt y={-22} text={name} fontFamily={FONT} fontWeight={800} fontSize={70} fill={color} />
      <Txt y={40} text={sub} fontFamily={FONT} fontWeight={650} fontSize={17} letterSpacing={2} fill={C.text2} />
    </Node>
  );
}

export default makeScene2D(function* (view) {
  const T = timing('s03_fastslow');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Kahneman, 2011', 'Fast and slow thinking');
  S.content.add(header.node);

  // --- the book -----------------------------------------------------------------------------
  const book = createRef<Rect>();
  S.content.add(
    <Panel ref={book} y={-10} width={560} height={240} opacity={0} layout direction="column" alignItems="center" justifyContent="center" gap={14}>
      <Txt text="Thinking, Fast and Slow" fontFamily={FONT} fontWeight={800} fontSize={46} fill={C.text} />
      <Txt text="Daniel Kahneman · 2011" fontFamily={FONT} fontSize={26} fill={C.text2} />
      <Txt text="two modes of thought" fontFamily={FONT} fontWeight={650} fontSize={18} letterSpacing={3} fill={C.text3} />
    </Panel>,
  );

  // --- two systems --------------------------------------------------------------------------
  const ring1 = createRef<Circle>();
  const ring2 = createRef<Circle>();
  const sys1 = createRef<Node>();
  const sys2 = createRef<Node>();
  S.content.add(systemOrb(-440, C.s1, 'System 1', 'FAST · AUTOMATIC · CHEAP', ring1, sys1));
  S.content.add(systemOrb(440, C.s2, 'System 2', 'SLOW · DELIBERATE · COSTLY', ring2, sys2));
  yield loop(Infinity, () => ring1().rotation(ring1().rotation() + 360, 2.2, linear));
  yield loop(Infinity, () => ring2().rotation(ring2().rotation() + 360, 16, linear));

  const pills1 = ['recognize a face', 'sense a hostile sentence'].map(() => createRef<Rect>());
  const pills2 = ['17 × 24 = ?', 'check an argument'].map(() => createRef<Rect>());
  S.content.add(
    <Node>
      {['recognize a face', 'sense a hostile sentence'].map((t, i) => (
        <Tag ref={pills1[i]} x={-440} y={278 + i * 66} text={t} color={C.s1} size={25} opacity={0} />
      ))}
      {['17 × 24 = ?', 'check an argument'].map((t, i) => (
        <Tag ref={pills2[i]} x={440} y={278 + i * 66} text={t} color={C.s2} size={25} opacity={0} />
      ))}
    </Node>,
  );

  // --- the same split in software -----------------------------------------------------------
  const rows = [
    ['Output', 'a probability per option', 'free text'],
    ['Work', 'one forward pass', 'one pass per token'],
    ['Latency', 'tens of ms on a GPU', 'grows with the output'],
    ['Best at', 'known options, every request', 'novel, multi-step problems'],
  ];
  const table = createRef<Node>();
  const rowRefs = rows.map(() => createRef<Node>());
  const colHead1 = createRef<Rect>();
  const colHead2 = createRef<Rect>();
  const tableTop = -150;
  S.content.add(
    <Node ref={table}>
      <Panel ref={colHead1} x={-150} y={tableTop} width={560} height={96} accent={C.s1} opacity={0} layout alignItems="center" justifyContent="center" direction="column">
        <Txt text="System 1 · decision engine" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.s1} />
      </Panel>
      <Panel ref={colHead2} x={480} y={tableTop} width={560} height={96} accent={C.s2} opacity={0} layout alignItems="center" justifyContent="center">
        <Txt text="System 2 · generative model" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.s2} />
      </Panel>
      {rows.map((r, i) => (
        <Node ref={rowRefs[i]} y={tableTop + 110 + i * 92} opacity={0}>
          <Rect x={0} width={1640} height={80} radius={16} fill={alpha('#94a3b8', i % 2 ? 0.03 : 0.06)} />
          <Txt x={-780} offsetX={-1} text={r[0]} fontFamily={FONT} fontWeight={700} fontSize={28} fill={C.text3} />
          <Txt x={-150} text={r[1]} fontFamily={FONT} fontWeight={650} fontSize={32} fill={C.text} />
          <Txt x={480} text={r[2]} fontFamily={FONT} fontSize={32} fill={C.text2} />
        </Node>
      ))}
    </Node>,
  );
  const bestAt = createRef<Rect>();
  S.content.add(
    <Rect ref={bestAt} x={-150} y={tableTop + 110 + 3 * 92} width={600} height={84} radius={18} stroke={C.s1} lineWidth={3} opacity={0} shadowColor={C.s1} shadowBlur={24} />,
  );

  // --- the cascade --------------------------------------------------------------------------
  const cascade = createRef<Node>();
  const dots = createRef<Node>();
  const req = createRef<Rect>();
  const s1Box = createRef<Rect>();
  const gate = createRef<Rect>();
  const act = createRef<Rect>();
  const s2Box = createRef<Rect>();
  const lines = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const Y = 20;
  S.content.add(
    <Node ref={cascade} opacity={0} scale={1.08}>
      <Node ref={dots} />
      <Line ref={lines[0]} points={[[-620, Y], [-400, Y]]} stroke={alpha(C.text3, 0.6)} lineWidth={3} endArrow arrowSize={12} />
      <Line ref={lines[1]} points={[[-120, Y], [60, Y]]} stroke={alpha(C.text3, 0.6)} lineWidth={3} endArrow arrowSize={12} />
      <Line ref={lines[2]} points={[[240, Y], [400, Y], [400, -130], [520, -130]]} radius={24} stroke={alpha(C.s1, 0.7)} lineWidth={3} endArrow arrowSize={12} />
      <Line ref={lines[3]} points={[[240, Y], [400, Y], [400, 170], [520, 170]]} radius={24} stroke={alpha(C.s2, 0.7)} lineWidth={3} endArrow arrowSize={12} />
      <Panel ref={req} x={-740} y={Y} width={220} height={110} layout alignItems="center" justifyContent="center" direction="column" gap={6}>
        <Icon name="message" size={34} color={C.text2} />
        <Txt text="request" fontFamily={FONT} fontWeight={650} fontSize={24} fill={C.text2} />
      </Panel>
      <Panel ref={s1Box} x={-260} y={Y} width={260} height={130} accent={C.s1} layout alignItems="center" justifyContent="center" direction="column" gap={8}>
        <Icon name="zap" size={38} color={C.s1} />
        <Txt text="System 1 answers" fontFamily={FONT} fontWeight={700} fontSize={25} fill={C.text} />
      </Panel>
      <Rect ref={gate} x={150} y={Y} width={150} height={150} rotation={45} radius={18} fill={alpha(C.surface2, 0.9)} stroke={alpha(C.score, 0.6)} lineWidth={2} />
      <Txt x={150} y={Y - 12} text="confident?" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.score} />
      <Txt x={150} y={Y + 18} text="≥ threshold" fontFamily={MONO} fontSize={17} fill={C.text3} />
      <Panel ref={act} x={680} y={-130} width={300} height={110} accent={C.s1} layout alignItems="center" justifyContent="center" direction="row" gap={14}>
        <Icon name="check" size={32} color={C.s1} stroke={3} />
        <Txt text="act on it" fontFamily={FONT} fontWeight={700} fontSize={28} fill={C.text} />
      </Panel>
      <Panel ref={s2Box} x={680} y={170} width={300} height={110} accent={C.s2} layout alignItems="center" justifyContent="center" direction="row" gap={14}>
        <Icon name="brain" size={32} color={C.s2} />
        <Txt text="System 2 or a human" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.text} />
      </Panel>
      <Txt x={470} y={-160} text="yes" fontFamily={FONT} fontWeight={700} fontSize={20} fill={C.s1} />
      <Txt x={470} y={140} text="no" fontFamily={FONT} fontWeight={700} fontSize={20} fill={C.s2} />
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(cue(B.b1, "Thinking,", -0.3));
  yield* rise(book(), 0.7, 30);
  yield* at(cue(B.b1, 'two modes', -0.2));
  yield* all(book().opacity(0, 0.5), book().scale(0.9, 0.5, easeInCubic));
  yield sys1().opacity(1, 0.8);
  yield* waitFor(0.2);
  yield sys2().opacity(1, 0.8);

  // b2: System 1
  yield* at(B.b2.start);
  yield all(sys1().scale(1.08, 0.5, easeOutCubic), sys2().opacity(0.35, 0.5));
  yield* at(cue(B.b2, 'recognizing', -0.2));
  yield* sequence(0.8, ...pills1.map((p) => rise(p(), 0.5, 20)));

  // b3: System 2
  yield* at(B.b3.start);
  yield all(sys1().scale(1, 0.5), sys1().opacity(0.45, 0.5), sys2().opacity(1, 0.5), sys2().scale(1.08, 0.5, easeOutCubic));
  yield* at(cue(B.b3, 'long multiplication', -0.2));
  yield* sequence(0.9, ...pills2.map((p) => rise(p(), 0.5, 20)));

  // b4: the same split in software
  yield* at(B.b4.start - 0.2);
  yield* all(
    sys1().opacity(0, 0.5),
    sys2().opacity(0, 0.5),
    ...pills1.map((p) => p().opacity(0, 0.4)),
    ...pills2.map((p) => p().opacity(0, 0.4)),
  );
  yield all(rise(colHead1(), 0.6, 24), rise(colHead2(), 0.6, 24));
  yield* waitFor(0.6);
  yield* sequence(0.45, ...rowRefs.map((r) => rise(r(), 0.5, 18)));
  yield* at(cue(B.b4, 'known options', -0.2));
  yield* bestAt().opacity(1, 0.4);
  yield bestAt().shadowBlur(40, 0.6).to(20, 0.6);

  // b5: gate, then escalate
  yield* at(B.b5.start - 0.35);
  yield* all(table().opacity(0, 0.4), bestAt().opacity(0, 0.4));
  yield* cascade().opacity(1, 0.5);
  yield S.note('diagram', 'Answer fast; escalate only when confidence is low');
  const random = useRandom(3);
  const toAct: [number, number][] = [[-640, Y], [-260, Y], [150, Y], [400, Y], [400, -130], [540, -130]];
  const toS2: [number, number][] = [[-640, Y], [-260, Y], [150, Y], [400, Y], [400, 170], [540, 170]];
  const spawnDot = function* (escalate: boolean) {
    const color = escalate ? C.s2 : C.s1;
    const d = (<Circle size={16} fill={color} shadowColor={color} shadowBlur={16} position={toAct[0]} opacity={0} />) as Circle;
    dots().add(d);
    yield d.opacity(1, 0.2);
    yield* travel(d, escalate ? toS2 : toAct, escalate ? 2.6 : 1.5, linear);
    yield* d.opacity(0, 0.25);
    d.remove();
  };
  const endAt = T.duration - 0.9;
  let n = 0;
  while (n < 60) {
    const now = cue(B.b5) + n * 0.28;
    if (now > endAt - 2.6) break;
    yield* at(now);
    yield spawnDot(random.nextFloat() < 0.18);
    n++;
  }

  yield* S.finish();
});
