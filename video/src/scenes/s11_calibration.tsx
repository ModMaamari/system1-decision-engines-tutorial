import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, KHMER, MONO, alpha} from '../lib/theme';
import {Icon, Panel, draw, pop, rise} from '../lib/ui';

const N = 10;
const GX = -440; // chart centre
const GY = 60;
const GS = 560; // chart size

export default makeScene2D(function* (view) {
  const T = timing('s11_calibration');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Training and calibration', 'Calibration');
  S.content.add(header.node);

  // reliability diagram
  const diagram = createRef<Node>();
  const diag = createRef<Line>();
  const centers = Array.from({length: N}, (_, i) => (i + 0.5) / N);
  const acc = centers.map(() => createSignal(0));
  const px = (c: number) => GX - GS / 2 + c * GS;
  const py = (a: number) => GY + GS / 2 - a * GS;
  const over = centers.map((c) => Math.max(0.02, c * 0.42 + 0.02));
  const fitted = centers.map((c, i) => Math.min(0.98, c + [0.02, -0.03, 0.03, -0.02, 0.01, -0.03, 0.02, -0.01, -0.02, 0.01][i]));
  const bin8 = createRef<Rect>();
  const bin8Note = createRef<Rect>();
  S.content.add(
    <Node ref={diagram} opacity={0}>
      <Rect x={GX} y={GY} width={GS} height={GS} fill={alpha('#94a3b8', 0.04)} stroke={alpha('#94a3b8', 0.25)} lineWidth={1.5} />
      {centers.map((c, i) => (
        <Rect x={px(c)} y={py(0)} offsetY={1} width={GS / N - 8} height={() => acc[i]() * GS} radius={[4, 4, 0, 0]} fill={() => (acc[i]() < c - 0.08 ? alpha(C.s2, 0.75) : alpha(C.s1, 0.8))} />
      ))}
      <Line ref={diag} points={[[px(0), py(0)], [px(1), py(1)]]} stroke={C.text} lineWidth={3} lineDash={[10, 8]} end={0} />
      <Txt x={GX} y={GY + GS / 2 + 44} text="confidence" fontFamily={FONT} fontSize={22} fill={C.text3} />
      <Txt x={GX - GS / 2 - 40} y={GY} text="accuracy" rotation={-90} fontFamily={FONT} fontSize={22} fill={C.text3} />
      <Txt x={px(0.36) - 22} y={py(0.36) - 22} rotation={-45} text="perfectly calibrated" fontFamily={FONT} fontWeight={600} fontSize={19} fill={C.text2} />
      <Rect ref={bin8} x={px(0.85)} y={py(0.85)} width={GS / N + 6} height={16} radius={8} stroke={C.score} lineWidth={3} opacity={0} />
      <Rect ref={bin8Note} x={px(0.85) + 40} y={py(0.85) - 50} offsetX={1} layout padding={[8, 14]} radius={10} fill={alpha(C.score, 0.14)} stroke={alpha(C.score, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="said 0.8+, right 80%+ of the time" fontFamily={FONT} fontWeight={650} fontSize={20} fill={C.score} />
      </Rect>
    </Node>,
  );

  // right column: ECE and temperature scaling
  const ece = createSignal(0.466);
  const eceBox = createRef<Rect>();
  const overTag = createRef<Rect>();
  const fixTag = createRef<Rect>();
  const sameTag = createRef<Rect>();
  S.content.add(
    <Node x={420}>
      <Panel ref={eceBox} y={-80} width={620} height={250} opacity={0} layout direction="column" alignItems="center" justifyContent="center" gap={4}>
        <Txt text="EXPECTED CALIBRATION ERROR" fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={3} fill={C.text3} />
        <Txt text={() => ece().toFixed(3)} fontFamily={FONT} fontWeight={850} fontSize={120} letterSpacing={-3} fill={() => (ece() > 0.2 ? C.s2 : C.s1Strong)} />
        <Txt text="laya, mean over question types" fontFamily={FONT} fontSize={20} fill={C.text3} />
      </Panel>
      <Rect ref={overTag} y={90} layout padding={[10, 20]} radius={12} fill={alpha(C.s2, 0.12)} stroke={alpha(C.s2, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="as shipped: over-confident" fontFamily={FONT} fontWeight={700} fontSize={24} fill={C.s2} />
      </Rect>
      <Rect ref={fixTag} y={160} layout direction="column" gap={4} alignItems="center" padding={[12, 22]} radius={14} fill={alpha(C.s1, 0.1)} stroke={alpha(C.s1, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="temperature scaling: p = softmax(z / T)" fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.s1Strong} />
        <Txt text="one T per question type, fitted on held-out data" fontFamily={FONT} fontSize={21} fill={C.text2} />
      </Rect>
      <Rect ref={sameTag} y={255} layout direction="row" gap={10} alignItems="center" padding={[10, 18]} radius={12} fill={alpha(C.good, 0.1)} stroke={alpha(C.good, 0.45)} lineWidth={1.5} opacity={0}>
        <Icon name="check" size={22} color={C.good} stroke={3} />
        <Txt text="no answer changes; accuracy is untouched" fontFamily={FONT} fontWeight={650} fontSize={22} fill={C.good} />
      </Rect>
    </Node>,
  );

  // b3: Khmer
  const khmer = createRef<Node>();
  const kAcc = createSignal(0);
  const kConf = createSignal(0);
  const warn = createRef<Rect>();
  S.content.add(
    <Node ref={khmer} opacity={0} y={40}>
      <Panel x={-470} width={620} height={420} layout direction="column" alignItems="center" justifyContent="center" gap={18}>
        <Txt text="INPUT" fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={4} fill={C.text3} />
        <Txt text="ខ្ញុំត្រូវការជំនួយ" fontFamily={KHMER} fontWeight={500} fontSize={64} fill={C.text} />
        <Txt text="Khmer · English checkpoint · 20-option intent" fontFamily={FONT} fontSize={22} fill={C.text3} />
      </Panel>
      <Node x={330}>
        {[
          {label: 'accuracy', v: kAcc, color: C.s2, fmt: 3},
          {label: 'confidence', v: kConf, color: C.score, fmt: 3},
        ].map((b, i) => (
          <Node x={(i - 0.5) * 240}>
            <Rect y={170} offsetY={1} width={140} height={340} radius={14} fill={alpha('#94a3b8', 0.07)} />
            <Rect y={170} offsetY={1} width={140} height={() => Math.max(4, b.v() * 340)} radius={14} fill={b.color} shadowColor={b.color} shadowBlur={20} />
            <Txt y={-210} text={() => b.v().toFixed(3)} fontFamily={MONO} fontWeight={800} fontSize={44} fill={b.color} />
            <Txt y={205} text={b.label} fontFamily={FONT} fontWeight={650} fontSize={24} fill={C.text2} />
          </Node>
        ))}
      </Node>
    </Node>,
  );
  S.content.add(
    <Rect ref={warn} y={370} layout direction="row" gap={14} alignItems="center" padding={[12, 26]} radius={999} fill={alpha(C.s2, 0.12)} stroke={alpha(C.s2, 0.6)} lineWidth={2} opacity={0}>
      <Icon name="alert" size={26} color={C.s2} stroke={2.4} />
      <Txt text="No threshold can catch this. Fix it before the forward pass." fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.text} />
    </Rect>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield* diagram().opacity(1, 0.5);
  yield* draw(diag(), 0.9);
  yield* at(cue(B.b1, 'of the answers', -0.2));
  yield* all(...acc.map((a, i) => a(centers[i], 0.9, easeOutCubic)));
  yield* all(bin8().opacity(1, 0.3), rise(bin8Note(), 0.5, 10));

  // b2: over-confident, then refit
  yield* at(B.b2.start - 0.1);
  yield all(bin8().opacity(0, 0.3), bin8Note().opacity(0, 0.3));
  yield* all(...acc.map((a, i) => a(over[i], 1.0, easeInOutCubic)));
  yield rise(eceBox(), 0.6, 20);
  yield* pop(overTag(), 0.5, 0.8);
  yield* at(cue(B.b2, 'temperature scaling', -0.2));
  yield* rise(fixTag(), 0.5, 16);
  yield* at(cue(B.b2, 'never changes', -0.2));
  yield* rise(sameTag(), 0.5, 16);
  yield* at(cue(B.b2, 'cuts calibration', -0.3));
  yield overTag().opacity(0.3, 0.5);
  yield* all(ece(0.081, 1.8, easeInOutCubic), ...acc.map((a, i) => a(fitted[i], 1.8, easeInOutCubic)));
  yield S.note('measured', 'ECE 0.466 → 0.081 after refitting temperatures (Laya README) · diagram illustrative');

  // b3: Khmer
  yield* at(B.b3.start - 0.2);
  yield* all(diagram().opacity(0, 0.4), eceBox().opacity(0, 0.4), overTag().opacity(0, 0.4), fixTag().opacity(0, 0.4), sameTag().opacity(0, 0.4), S.hideNote());
  yield* khmer().opacity(1, 0.5);
  yield* at(cue(B.b3, 'zero accuracy', -0.2));
  yield* kAcc(0.0, 0.3);
  yield* at(cue(B.b3, 'ninety', -0.3));
  yield* kConf(0.952, 1.1, easeOutCubic);
  yield S.note('measured', '51-language sweep, English checkpoint (Laya README)');
  yield* rise(warn(), 0.5, 16);

  yield* S.finish();
});
