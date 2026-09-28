import {Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, useRandom, waitFor, type SimpleSignal} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Panel, draw, pop, pulse, rise} from '../lib/ui';

const K = 4;
const TEACHER = [0.55, 0.25, 0.12, 0.08];
const START = [0.3, 0.3, 0.25, 0.15];

/** A mini bar chart of a distribution, driven by signals. */
function dist(values: SimpleSignal<number>[], color: string, w = 150, h = 110, target?: number[]) {
  const bw = w / K - 10;
  return (
    <Node>
      <Rect width={w + 24} height={h + 24} radius={14} fill={alpha('#0b1220', 0.6)} stroke={alpha('#94a3b8', 0.15)} lineWidth={1} />
      {values.map((v, i) => (
        <Rect x={-w / 2 + (i + 0.5) * (w / K)} y={h / 2} offsetY={1} width={bw} height={() => Math.max(3, v() * h * 1.6)} radius={4} fill={color} />
      ))}
      {target?.map((t, i) => (
        <Rect x={-w / 2 + (i + 0.5) * (w / K)} y={h / 2} offsetY={1} width={bw + 6} height={t * h * 1.6} radius={4} stroke={C.score} lineWidth={2} lineDash={[5, 4]} />
      ))}
    </Node>
  );
}

export default makeScene2D(function* (view) {
  const T = timing('s10_rlcd');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Training and calibration', 'Training with honest rewards');
  S.content.add(header.node);

  // b1: the acronym
  const title = createRef<Node>();
  const letters = ['R', 'L', 'C', 'D'];
  const words = ['Reinforcement', 'Learning for', 'Calibrated', 'Decisions'];
  const letterRefs = letters.map(() => createRef<Txt>());
  const wordRefs = words.map(() => createRef<Txt>());
  S.content.add(
    <Node ref={title} y={20}>
      {letters.map((l, i) => (
        <Txt ref={letterRefs[i]} x={(i - 1.5) * 380} y={-60} text={l} fontFamily={FONT} fontWeight={900} fontSize={200} fill={C.s1Strong} opacity={0} shadowColor={alpha(C.s1, 0.5)} shadowBlur={40} />
      ))}
      {words.map((w, i) => (
        <Txt ref={wordRefs[i]} x={(i - 1.5) * 380} y={110} text={w} fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.text} opacity={0} />
      ))}
    </Node>,
  );

  // b2-b3: the update
  const loop = createRef<Node>();
  const random = useRandom(8);
  const z = START.map((p) => createSignal(p));
  const G = 4;
  const samples = Array.from({length: G}, () => START.map((p) => createSignal(p)));
  const rewards = [-1.02, -0.88, -1.21, -0.79];
  const adv = [-0.2, 0.62, -1.28, 0.86];
  const sampleRefs = Array.from({length: G}, () => createRef<Node>());
  const rewardRefs = Array.from({length: G}, () => createRef<Rect>());
  const advRefs = Array.from({length: G}, () => createRef<Rect>());
  const arrows = Array.from({length: G}, () => createRef<Line>());
  const back = createRef<Line>();
  const ce = createRef<Rect>();
  const modelBox = createRef<Node>();
  const sy = (g: number) => -150 + g * 118 + 60;
  S.content.add(
    <Node ref={loop} opacity={0}>
      <Node ref={modelBox} x={-620} y={60}>
        <Txt y={-120} text="model's distribution" fontFamily={FONT} fontWeight={650} fontSize={22} fill={C.text2} />
        {dist(z, C.s1, 200, 130, TEACHER)}
        <Txt y={122} text="teacher target (dashed)" fontFamily={FONT} fontSize={19} fill={C.score} />
      </Node>
      {Array.from({length: G}, (_, g) => (
        <Line ref={arrows[g]} points={[[-480, 60], [-300, sy(g)]]} stroke={alpha(C.text3, 0.45)} lineWidth={2} endArrow arrowSize={8} end={0} />
      ))}
      <Txt x={-190} y={-200} text="G noisy samples" fontFamily={FONT} fontWeight={650} fontSize={21} fill={C.text2} />
      {samples.map((s, g) => (
        <Node ref={sampleRefs[g]} x={-190} y={sy(g)} opacity={0} scale={0.8}>
          {dist(s, alpha(C.s1, 0.6), 130, 70)}
        </Node>
      ))}
      <Txt x={90} y={-200} text="proper reward" fontFamily={FONT} fontWeight={650} fontSize={21} fill={C.text2} />
      {rewards.map((r, g) => (
        <Rect ref={rewardRefs[g]} x={90} y={sy(g)} layout padding={[8, 16]} radius={10} fill={alpha(C.noul, 0.12)} stroke={alpha(C.noul, 0.45)} lineWidth={1.5} opacity={0}>
          <Txt text={`r = ${r.toFixed(2)}`} fontFamily={MONO} fontWeight={600} fontSize={22} fill={C.noul} />
        </Rect>
      ))}
      <Txt x={360} y={-200} text="vs. group average" fontFamily={FONT} fontWeight={650} fontSize={21} fill={C.text2} />
      {adv.map((a, g) => (
        <Rect ref={advRefs[g]} x={360} y={sy(g)} layout padding={[8, 16]} radius={10} fill={alpha(a > 0 ? C.good : C.s2, 0.14)} stroke={alpha(a > 0 ? C.good : C.s2, 0.55)} lineWidth={1.5} opacity={0}>
          <Txt text={`A = ${a > 0 ? '+' : '−'}${Math.abs(a).toFixed(2)}`} fontFamily={MONO} fontWeight={700} fontSize={22} fill={a > 0 ? C.good : C.s2} />
        </Rect>
      ))}
      <Line ref={back} points={[[470, sy(3)], [560, sy(3)], [560, 330], [-620, 330], [-620, 210]]} radius={30} stroke={C.good} lineWidth={3} endArrow arrowSize={12} end={0} lineDash={[10, 8]} />
      <Txt x={0} y={360} text="move the logits towards the above-average samples" fontFamily={FONT} fontWeight={600} fontSize={22} fill={C.good} opacity={() => back().end()} />
      <Rect ref={ce} x={680} y={60} layout direction="column" gap={6} padding={[16, 22]} radius={14} fill={alpha(C.score, 0.1)} stroke={alpha(C.score, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="+ soft cross-entropy" fontFamily={FONT} fontWeight={750} fontSize={24} fill={C.score} />
        <Txt text="pulls towards the teacher's" fontFamily={FONT} fontSize={19} fill={C.text2} />
        <Txt text="whole distribution" fontFamily={FONT} fontSize={19} fill={C.text2} />
      </Rect>
    </Node>,
  );

  // b4: the benchmark
  const bench = createRef<Node>();
  const rows = [
    {label: 'laya (base)', v: 0.362, color: alpha(C.text3, 0.8)},
    {label: 'laya-multilingual (base)', v: 0.352, color: alpha(C.text3, 0.8)},
    {label: 'Jev 1.13 (published)', v: 0.727, color: alpha(C.choice, 0.8)},
    {label: 'laya-typed-decisions (fine-tuned)', v: 0.766, color: C.s1},
  ];
  const bv = rows.map(() => createSignal(0));
  const BW = 900;
  const bx0 = -250;
  const refLines = [
    {v: 0.318, label: 'random 0.318'},
    {v: 0.461, label: 'majority 0.461'},
    {v: 0.735, label: 'teacher 0.735'},
  ];
  S.content.add(
    <Node ref={bench} opacity={0} y={40}>
      <Txt x={-840} y={-230} offsetX={-1} text="typed-decisions benchmark · accuracy" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.text2} />
      {rows.map((r, i) => (
        <Node y={-140 + i * 88}>
          <Txt x={bx0 - 30} offsetX={1} text={r.label} fontFamily={FONT} fontWeight={i === 3 ? 750 : 550} fontSize={27} fill={i === 3 ? C.text : C.text2} />
          <Rect x={bx0} offsetX={-1} width={() => bv[i]() * BW} height={44} radius={10} fill={r.color} shadowColor={C.s1} shadowBlur={i === 3 ? 22 : 0} />
          <Txt x={() => bx0 + bv[i]() * BW + 16} offsetX={-1} text={() => bv[i]().toFixed(3)} fontFamily={MONO} fontWeight={700} fontSize={26} fill={i === 3 ? C.s1Strong : C.text2} />
        </Node>
      ))}
      {refLines.map((l, i) => (
        <Node>
          <Line points={[[bx0 + l.v * BW, -200], [bx0 + l.v * BW, 170]]} stroke={alpha(C.score, 0.55)} lineWidth={2} lineDash={[6, 6]} />
          <Txt x={bx0 + l.v * BW} y={200 + (i % 2) * 30} text={l.label} fontFamily={MONO} fontSize={18} fill={C.score} />
        </Node>
      ))}
    </Node>,
  );
  const jump = createRef<Node>();
  S.content.add(
    <Node ref={jump} x={0} y={345} opacity={0}>
      <Rect layout direction="row" gap={20} alignItems="center" padding={[14, 30]} radius={999} fill={alpha(C.s1, 0.12)} stroke={alpha(C.s1, 0.6)} lineWidth={2}>
        <Txt text="0.362" fontFamily={MONO} fontWeight={700} fontSize={34} fill={C.text2} />
        <Txt text="→" fontFamily={FONT} fontSize={34} fill={C.text3} />
        <Txt text="0.766" fontFamily={MONO} fontWeight={800} fontSize={34} fill={C.s1Strong} />
        <Txt text="after fine-tuning, above the teacher's own agreement" fontFamily={FONT} fontWeight={600} fontSize={24} fill={C.text2} />
      </Rect>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start + 0.3);
  yield* sequence(0.12, ...letterRefs.map((l) => pop(l(), 0.5, 0.5)));
  yield* at(cue(B.b1, 'RLCD', -0.2));
  yield* all(...letterRefs.map((l) => pulse(l(), 1.08, 0.5)));
  yield* at(cue(B.b1, 'Reinforcement', -0.1));
  for (let i = 0; i < 4; i++) {
    yield all(wordRefs[i]().opacity(1, 0.4), pulse(letterRefs[i](), 1.12, 0.4));
    yield* waitFor(0.45);
  }

  // b2: sample, reward, compare
  yield* at(B.b2.start - 0.3);
  yield* all(title().opacity(0, 0.4), title().scale(0.9, 0.4));
  yield* loop().opacity(1, 0.5);
  yield* at(cue(B.b2, 'adds noise', -0.1));
  yield* sequence(0.1, ...arrows.map((a) => a().end(1, 0.4, easeOutCubic)));
  yield* sequence(0.12, ...sampleRefs.map((s) => all(s().opacity(1, 0.3), s().scale(1, 0.4, easeOutCubic))));
  // jitter the samples around the model's distribution
  yield (function* () {
    for (let k = 0; k < 6; k++) {
      yield* all(
        ...samples.map((s) => {
          const noise = START.map(() => random.nextFloat(-0.12, 0.12));
          const raw = START.map((p, i) => Math.max(0.02, p + noise[i]));
          const sum = raw.reduce((a, b) => a + b, 0);
          return all(...s.map((v, i) => v(raw[i] / sum, 0.45, easeInOutCubic)));
        }),
      );
    }
  })();
  yield* at(cue(B.b2, 'rewards each', -0.1));
  yield* sequence(0.12, ...rewardRefs.map((r) => pop(r(), 0.4, 0.7)));
  yield* at(cue(B.b2, 'compares', -0.1));
  yield* sequence(0.12, ...advRefs.map((r) => pop(r(), 0.4, 0.7)));

  // b3: update towards the good samples and the teacher
  yield* at(B.b3.start);
  yield* draw(back(), 1.0);
  yield* all(...z.map((v, i) => v(START[i] + (TEACHER[i] - START[i]) * 0.5, 1.2, easeInOutCubic)));
  yield* at(cue(B.b3, 'soft cross', -0.2));
  yield* rise(ce(), 0.5, 16);
  yield* all(...z.map((v, i) => v(TEACHER[i], 1.4, easeInOutCubic)));
  yield pulse(modelBox(), 1.06, 0.6);

  // b4: the result
  yield* at(B.b4.start - 0.3);
  yield* loop().opacity(0, 0.4);
  yield* bench().opacity(1, 0.5);
  yield S.note('measured', 'typed-decisions: 400 cases, 2,000 decisions (Laya README, BENCHMARKS.md)');
  yield* at(cue(B.b4, 'the base model', -0.2));
  yield* all(bv[0](rows[0].v, 0.8, easeOutCubic), bv[1](rows[1].v, 0.8, easeOutCubic));
  yield bv[2](rows[2].v, 0.9, easeOutCubic);
  yield* at(cue(B.b4, 'Fine-tuned', -0.2));
  yield* bv[3](rows[3].v, 1.2, easeOutCubic);
  yield* rise(jump(), 0.6, 20);

  yield* S.finish();
});
