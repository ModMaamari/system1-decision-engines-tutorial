import {Circle, Latex, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Panel, draw, pop, rise} from '../lib/ui';

const P = 0.7; // the true probability

// Expected reward for reporting q when the truth is P (binary outcome).
const RULES = [
  {id: 'log', label: 'log', color: C.s1, f: (q: number) => P * Math.log(q) + (1 - P) * Math.log(1 - q)},
  {id: 'sph', label: 'spherical', color: C.choice, f: (q: number) => (P * q + (1 - P) * (1 - q)) / Math.hypot(q, 1 - q)},
  {id: 'brier', label: 'Brier', color: C.noul, f: (q: number) => -2 * (P * (1 - q) ** 2 + (1 - P) * q ** 2)},
  {id: 'lin', label: 'linear', color: C.s2, f: (q: number) => P * q + (1 - P) * (1 - q)},
  {id: 'acc', label: 'accuracy', color: '#94a3b8', f: (q: number) => (q > 0.5 ? P : q < 0.5 ? 1 - P : 0.5)},
];

const CX = -120; // chart centre
const CY = 90;
const CW = 1060;
const CH = 470;
const Q0 = 0.02;
const Q1 = 0.98;

function curvePoints(f: (q: number) => number, step = 0.005): [number, number][] {
  const qs: number[] = [];
  for (let q = Q0; q <= Q1 + 1e-9; q += step) qs.push(q);
  const ys = qs.map(f);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  return qs.map((q, i) => [CX - CW / 2 + ((q - Q0) / (Q1 - Q0)) * CW, CY + CH / 2 - ((ys[i] - lo) / (hi - lo || 1)) * CH]);
}
const xOf = (q: number) => CX - CW / 2 + ((q - Q0) / (Q1 - Q0)) * CW;

export default makeScene2D(function* (view) {
  const T = timing('s09_scoring');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Training and calibration', 'Proper scoring rules');
  S.content.add(header.node);

  // b1: the promise
  const quote = createRef<Node>();
  S.content.add(
    <Node ref={quote} y={30} opacity={0}>
      <Txt y={-60} text="When it says 0.9," fontFamily={FONT} fontWeight={800} fontSize={84} letterSpacing={-2} fill={C.text} />
      <Txt y={50} text="it should be right 9 times in 10." fontFamily={FONT} fontWeight={800} fontSize={84} letterSpacing={-2} fill={C.s1Strong} />
    </Node>,
  );

  // b2: definition
  const def = createRef<Rect>();
  S.content.add(
    <Panel ref={def} y={40} width={1300} height={300} accent={C.noul} opacity={0} layout direction="column" alignItems="center" justifyContent="center" gap={26}>
      <Txt text="STRICTLY PROPER" fontFamily={FONT} fontWeight={700} fontSize={20} letterSpacing={4} fill={C.noul} />
      <Latex tex={'\\mathbb{E}_{y\\sim p}\\big[S(q,y)\\big]\\ \\text{is maximised only at}\\ q=p'} height={62} fill={C.text} />
      <Txt text="Overclaiming and hedging both cost reward. Honesty is the optimum." fontFamily={FONT} fontSize={28} fill={C.text2} />
    </Panel>,
  );

  // b3: the chart
  const chart = createRef<Node>();
  const curves = RULES.map(() => createRef<Line>());
  const peaks = RULES.map(() => createRef<Circle>());
  const legend = RULES.map(() => createRef<Node>());
  const truth = createRef<Line>();
  const edgeNote = createRef<Rect>();
  const flatNote = createRef<Rect>();
  S.content.add(
    <Node ref={chart} opacity={0}>
      <Line points={[[CX - CW / 2, CY + CH / 2 + 20], [CX + CW / 2 + 20, CY + CH / 2 + 20]]} stroke={alpha(C.text3, 0.6)} lineWidth={2} endArrow arrowSize={10} />
      <Line points={[[CX - CW / 2 - 20, CY + CH / 2 + 20], [CX - CW / 2 - 20, CY - CH / 2 - 20]]} stroke={alpha(C.text3, 0.6)} lineWidth={2} endArrow arrowSize={10} />
      <Txt x={CX} y={CY + CH / 2 + 72} text="reported probability q" fontFamily={FONT} fontSize={22} fill={C.text3} />
      <Txt x={CX - CW / 2 - 48} y={CY} text="expected reward (rescaled)" rotation={-90} fontFamily={FONT} fontSize={22} fill={C.text3} />
      {[0, 0.5, 1].map((q) => (
        <Txt x={xOf(Math.min(Math.max(q, Q0), Q1))} y={CY + CH / 2 + 30 + 4} text={q.toFixed(1)} fontFamily={MONO} fontSize={17} fill={C.text3} offsetY={-1} />
      ))}
      <Line ref={truth} points={[[xOf(P), CY - CH / 2 - 30], [xOf(P), CY + CH / 2 + 20]]} stroke={alpha(C.text, 0.5)} lineWidth={2} lineDash={[8, 8]} end={0} />
      <Txt x={xOf(P)} y={CY - CH / 2 - 52} text="truth p = 0.7" fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.text} />
      {RULES.map((r, i) => (
        <Line ref={curves[i]} points={curvePoints(r.f)} stroke={r.color} lineWidth={r.id === 'acc' ? 4 : 5} end={0} lineCap="round" lineJoin="round" shadowColor={r.color} shadowBlur={r.id === 'acc' ? 0 : 12} />
      ))}
      {RULES.slice(0, 3).map((r, i) => {
        const pts = curvePoints(r.f);
        const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
        return <Circle ref={peaks[i]} position={top} size={20} fill={r.color} stroke={C.bg} lineWidth={3} opacity={0} />;
      })}
      {RULES.map((r, i) => (
        <Node ref={legend[i]} x={620} y={0 + i * 58} opacity={0}>
          <Rect width={34} height={6} radius={3} fill={r.color} />
          <Txt x={32} offsetX={-1} text={r.label} fontFamily={FONT} fontWeight={650} fontSize={26} fill={C.text} />
          <Txt x={290} offsetX={1} text={i < 3 ? 'proper' : 'not proper'} fontFamily={FONT} fontSize={20} fill={i < 3 ? C.s1 : C.s2} />
        </Node>
      ))}
      <Rect ref={edgeNote} x={xOf(0.98) + 24} y={CY - CH / 2 - 10} offsetX={-1} layout padding={[8, 14]} radius={10} fill={alpha(C.s2, 0.14)} stroke={alpha(C.s2, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="pays for overconfidence" fontFamily={FONT} fontWeight={700} fontSize={21} fill={C.s2} />
      </Rect>
      <Rect ref={flatNote} x={xOf(0.72) + 10} y={CY + 150} offsetX={-1} layout padding={[8, 14]} radius={10} fill={alpha('#94a3b8', 0.12)} stroke={alpha('#94a3b8', 0.45)} lineWidth={1.5} opacity={0}>
        <Txt text="accuracy: 0.51 scores the same as 0.99" fontFamily={FONT} fontWeight={700} fontSize={21} fill={C.text2} />
      </Rect>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield* rise(quote(), 0.8, 30);

  yield* at(B.b2.start - 0.3);
  yield* all(quote().opacity(0, 0.4), quote().y(0, 0.4));
  yield* at(cue(B.b2, 'strictly proper', -0.3));
  yield* rise(def(), 0.7, 30);

  yield* at(B.b3.start - 0.3);
  yield* all(def().opacity(0, 0.4), def().scale(0.95, 0.4));
  yield* chart().opacity(1, 0.4);
  yield* draw(truth(), 0.6);
  yield* at(cue(B.b3, 'log', -0.2));
  for (let i = 0; i < 3; i++) {
    yield legend[i]().opacity(1, 0.3);
    yield* curves[i]().end(1, 0.8, easeInOutCubic);
    yield pop(peaks[i](), 0.4, 0.5);
  }
  yield* at(cue(B.b3, 'A linear', -0.2));
  yield legend[3]().opacity(1, 0.3);
  yield* curves[3]().end(1, 0.9, easeInOutCubic);
  yield* pop(edgeNote(), 0.45, 0.7);
  yield* at(cue(B.b3, 'plain accuracy', -0.2));
  yield legend[4]().opacity(1, 0.3);
  yield* curves[4]().end(1, 0.9, easeInOutCubic);
  yield* pop(flatNote(), 0.45, 0.7);
  yield S.note('formula', 'Expected reward for a yes/no outcome with p = 0.7; each curve rescaled to the same height');

  yield* S.finish();
});
