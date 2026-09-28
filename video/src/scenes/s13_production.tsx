import {Circle, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, useRandom, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, draw, pop, rise} from '../lib/ui';

const AX0 = -720;
const AX1 = 720;
const LO = 0.3;
const HI = 1.0;
const AY = 250;

export default makeScene2D(function* (view) {
  const T = timing('s13_production');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Using it', 'Production patterns');
  S.content.add(header.node);

  // b1
  const statement = createRef<Node>();
  S.content.add(
    <Node ref={statement} y={20} opacity={0}>
      <Txt y={-40} text="Evidence, not permission." fontFamily={FONT} fontWeight={850} fontSize={96} letterSpacing={-2.5} fill={C.text} />
      <Txt y={60} text="The application owns the action, the threshold, review and rollback." fontFamily={FONT} fontSize={32} fill={C.text2} />
    </Node>,
  );

  // b2: confidence gating
  const random = useRandom(21);
  const thr = createSignal(0.85);
  const xOf = (c: number) => AX0 + ((c - LO) / (HI - LO)) * (AX1 - AX0);
  const decisions = Array.from({length: 150}, () => {
    const c = Math.min(0.995, Math.max(LO + 0.01, 1 - Math.abs(random.gauss(0, 0.2))));
    return {c, y: AY - 30 - random.nextFloat(0, 320)};
  });
  const gate = createRef<Node>();
  const auto = () => decisions.filter((d) => d.c >= thr()).length / decisions.length;
  S.content.add(
    <Node ref={gate} opacity={0}>
      <Line points={[[AX0, AY], [AX1, AY]]} stroke={alpha(C.text3, 0.6)} lineWidth={2} />
      {[0.3, 0.5, 0.7, 0.9, 1.0].map((c) => (
        <Txt x={xOf(c)} y={AY + 28} text={c.toFixed(1)} fontFamily={MONO} fontSize={18} fill={C.text3} />
      ))}
      <Txt x={0} y={AY + 62} text="answer_confidence of each decision" fontFamily={FONT} fontSize={21} fill={C.text3} />
      {decisions.map((d) => (
        <Circle
          x={xOf(d.c)}
          y={d.y}
          size={14}
          fill={() => (d.c >= thr() ? C.s1 : C.s2)}
          opacity={() => (d.c >= thr() ? 0.95 : 0.8)}
        />
      ))}
      <Line points={() => [[xOf(thr()), AY - 380], [xOf(thr()), AY + 8]]} stroke={C.score} lineWidth={4} shadowColor={C.score} shadowBlur={16} />
      <Rect x={() => xOf(thr())} y={AY - 408} layout padding={[8, 16]} radius={10} fill={alpha(C.score, 0.16)} stroke={alpha(C.score, 0.6)} lineWidth={1.5}>
        <Txt text={() => `threshold ${thr().toFixed(2)}`} fontFamily={MONO} fontWeight={700} fontSize={21} fill={C.score} />
      </Rect>
      <Node x={-560} y={-230}>
        <Txt offsetX={-1} x={-160} text={() => `${Math.round((1 - auto()) * 100)}%`} fontFamily={FONT} fontWeight={850} fontSize={64} fill={C.s2} />
        <Txt offsetX={-1} x={-160} y={50} text="escalate: human, rule or larger model" fontFamily={FONT} fontWeight={600} fontSize={21} fill={C.text2} />
      </Node>
      <Node x={560} y={-230}>
        <Txt offsetX={1} x={160} text={() => `${Math.round(auto() * 100)}%`} fontFamily={FONT} fontWeight={850} fontSize={64} fill={C.s1Strong} />
        <Txt offsetX={1} x={160} y={50} text="act automatically" fontFamily={FONT} fontWeight={600} fontSize={21} fill={C.text2} />
      </Node>
    </Node>,
  );

  // b3: staged adoption
  const stages = [
    {icon: 'eye' as const, title: 'Shadow', body: 'run on real traffic; the incumbent stays in charge'},
    {icon: 'layers' as const, title: 'Compare', body: 'measure against the incumbent, slice by slice'},
    {icon: 'gauge' as const, title: 'Choose a policy', body: 'threshold from accuracy and error cost'},
    {icon: 'flag' as const, title: 'Promote a slice', body: 'bounded traffic, sampled, with rollback'},
  ];
  const stageRefs = stages.map(() => createRef<Rect>());
  const arrows = stages.slice(1).map(() => createRef<Line>());
  const rollback = createRef<Line>();
  const rollbackLabel = createRef<Rect>();
  const staged = createRef<Node>();
  S.content.add(
    <Node ref={staged} y={30}>
      {stages.map((s, i) => (
        <Panel ref={stageRefs[i]} x={(i - 1.5) * 440} width={390} height={290} accent={i === 3 ? C.s1 : undefined} opacity={0} layout direction="column" padding={36} gap={16}>
          <Rect layout direction="row" gap={14} alignItems="center">
            <Rect width={56} height={56} radius={16} fill={alpha(C.s1, 0.14)} layout alignItems="center" justifyContent="center">
              <Icon name={s.icon} size={30} color={C.s1} />
            </Rect>
            <Txt text={`${i + 1}`} fontFamily={MONO} fontWeight={700} fontSize={24} fill={C.text3} />
          </Rect>
          <Txt text={s.title} fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.text} />
          <Txt text={s.body} fontFamily={FONT} fontSize={23} lineHeight={32} fill={C.text2} textWrap width={318} />
        </Panel>
      ))}
      {arrows.map((a, i) => (
        <Line ref={a} points={[[(i - 1.5) * 440 + 198, 0], [(i - 0.5) * 440 - 198, 0]]} stroke={alpha(C.s1, 0.7)} lineWidth={3} endArrow arrowSize={10} end={0} />
      ))}
      <Line ref={rollback} points={[[1.5 * 440, 150], [1.5 * 440, 215], [-1.5 * 440, 215], [-1.5 * 440, 150]]} radius={24} stroke={C.score} lineWidth={3} lineDash={[10, 8]} endArrow arrowSize={11} end={0} />
      <Rect ref={rollbackLabel} y={215} layout padding={[6, 16]} radius={999} fill={C.bg} stroke={alpha(C.score, 0.6)} lineWidth={1.5} opacity={0} gap={8} alignItems="center">
        <Icon name="refresh" size={18} color={C.score} />
        <Txt text="roll back when a guardrail is breached" fontFamily={FONT} fontWeight={650} fontSize={20} fill={C.score} />
      </Rect>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start - 0.1);
  yield* rise(statement(), 0.8, 30);

  yield* at(B.b2.start - 0.3);
  yield* all(statement().opacity(0, 0.4), statement().y(-10, 0.4));
  yield* gate().opacity(1, 0.6);
  yield S.note('illustrative', 'Simulated confidences; choose the threshold from your own measured accuracy');
  yield* at(cue(B.b2, 'below it', -0.1));
  yield* thr(0.7, 1.6, easeInOutCubic);
  yield* at(cue(B.b2, 'The threshold is', -0.2));
  yield* thr(0.93, 1.8, easeInOutCubic);
  yield* thr(0.85, 1.4, easeInOutCubic);

  yield* at(B.b3.start - 0.3);
  yield* all(gate().opacity(0, 0.4), S.hideNote());
  yield S.note('diagram', "Condensed from Laya's docs/staged-adoption.md");
  for (const [i, phrase] of ['shadow', 'compare', 'choose a policy', 'then promote'].entries()) {
    yield* at(cue(B.b3, phrase, -0.25));
    if (i > 0) yield arrows[i - 1]().end(1, 0.4, easeOutCubic);
    yield rise(stageRefs[i](), 0.55, 24);
  }
  yield* at(cue(B.b3, 'rollback', -0.3));
  yield* all(draw(rollback(), 0.9), rollbackLabel().opacity(1, 0.6));

  yield* S.finish();
});
