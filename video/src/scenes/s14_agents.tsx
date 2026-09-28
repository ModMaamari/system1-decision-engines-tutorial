import {Circle, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, linear, loop, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, Tag, draw, pop, pulse, rise} from '../lib/ui';

const LX = -470; // loop centre
const LY = 40;
const LR = 220;

export default makeScene2D(function* (view) {
  const T = timing('s14_agents');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Agents and applications', 'System 1 inside agents');
  S.content.add(header.node);

  const agent = createRef<Node>();
  S.content.add(<Node ref={agent} />);

  // the loop
  const ring = createRef<Circle>();
  const runner = createSignal(0);
  const loopNode = createRef<Node>();
  const steps = ['observe', 'decide', 'act', 'check'];
  agent().add(
    <Node ref={loopNode} x={LX} y={LY} opacity={0}>
      <Circle ref={ring} size={LR * 2} stroke={alpha('#94a3b8', 0.3)} lineWidth={3} lineDash={[4, 10]} />
      <Circle size={LR * 2} stroke={C.s1} lineWidth={4} startAngle={() => runner() * 360 - 90 - 40} endAngle={() => runner() * 360 - 90} shadowColor={C.s1} shadowBlur={16} />
      <Txt y={-14} text="agent" fontFamily={FONT} fontWeight={800} fontSize={40} fill={C.text} />
      <Txt y={24} text="loop" fontFamily={FONT} fontWeight={600} fontSize={26} fill={C.text3} />
      {steps.map((s, i) => {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
        return (
          <Rect x={Math.cos(a) * LR} y={Math.sin(a) * LR} layout padding={[10, 18]} radius={999} fill={C.surface2} stroke={alpha('#94a3b8', 0.35)} lineWidth={1.5}>
            <Txt text={s} fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.text} />
          </Rect>
        );
      })}
    </Node>,
  );

  // decisions
  const qs = [
    {q: 'Is this input safe?', kind: 'noul', color: C.noul},
    {q: 'Which tool comes next?', kind: 'choice', color: C.choice},
    {q: 'Is the task done?', kind: 'choice', color: C.choice},
    {q: 'Is this output good enough?', kind: 'score', color: C.score},
  ];
  const QX = 200;
  const QY = (i: number) => -170 + i * 125;
  const qRefs = qs.map(() => createRef<Rect>());
  const qLinks = qs.map(() => createRef<Line>());
  const fast = qs.map(() => createRef<Txt>());
  qs.forEach((q, i) => {
    agent().add(
      <Line ref={qLinks[i]} points={[[LX + LR + 20, LY + (i - 1.5) * 40], [QX - 250, QY(i)]]} stroke={alpha(C.s1, 0.35)} lineWidth={2} end={0} />,
    );
    agent().add(
      <Panel ref={qRefs[i]} x={QX} y={QY(i)} width={520} height={96} radius={18} accent={C.s1} opacity={0} layout direction="row" alignItems="center" padding={[0, 26]} gap={16}>
        <Icon name="zap" size={26} color={C.s1} />
        <Txt text={q.q} fontFamily={FONT} fontWeight={700} fontSize={27} fill={C.text} grow={1} />
        <Tag text={q.kind} color={q.color} size={15} />
      </Panel>,
    );
    agent().add(<Txt ref={fast[i]} x={QX + 282} y={QY(i)} offsetX={-1} text="~20 ms" fontFamily={MONO} fontWeight={600} fontSize={20} fill={C.s1} opacity={0} />);
  });

  // escalation
  const s2 = createRef<Rect>();
  const esc = createRef<Line>();
  const lowTag = createRef<Rect>();
  agent().add(
    <Node>
      <Line ref={esc} points={[[QX + 372, QY(3)], [720, QY(3)], [720, 330]]} radius={24} stroke={C.s2} lineWidth={3} lineDash={[10, 8]} endArrow arrowSize={11} end={0} />
      <Rect ref={lowTag} x={QX + 60} y={QY(3) + 72} layout padding={[6, 14]} radius={999} fill={alpha(C.s2, 0.14)} stroke={alpha(C.s2, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="low confidence" fontFamily={FONT} fontWeight={700} fontSize={18} fill={C.s2} />
      </Rect>
      <Panel ref={s2} x={720} y={390} width={320} height={100} accent={C.s2} opacity={0} layout direction="row" alignItems="center" justifyContent="center" gap={14}>
        <Icon name="brain" size={32} color={C.s2} />
        <Txt text="System 2 (LLM)" fontFamily={FONT} fontWeight={750} fontSize={27} fill={C.text} />
      </Panel>
    </Node>,
  );

  // b4: browser agent
  const browser = createRef<Node>();
  const bars = [
    {label: 'zero-shot', v: 0.1, color: alpha(C.text3, 0.8)},
    {label: 'fine-tuned, 322M', v: 0.63, color: alpha(C.s1, 0.7)},
    {label: 'fine-tuned, 421M', v: 0.66, color: C.s1},
  ];
  const bv = bars.map(() => createSignal(0));
  const BW = 640;
  const side = createRef<Rect>();
  S.content.add(
    <Node ref={browser} opacity={0} y={30}>
      <Txt x={-840} y={-210} offsetX={-1} text="Browser agent: pick the right page element (~45 candidates)" fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.text} />
      {bars.map((b, i) => (
        <Node y={-100 + i * 96}>
          <Txt x={-560} offsetX={1} text={b.label} fontFamily={FONT} fontWeight={600} fontSize={26} fill={C.text2} />
          <Rect x={-530} offsetX={-1} width={BW} height={54} radius={12} fill={alpha('#94a3b8', 0.07)} />
          <Rect x={-530} offsetX={-1} width={() => bv[i]() * BW} height={54} radius={12} fill={b.color} shadowColor={C.s1} shadowBlur={i === 2 ? 20 : 0} />
          <Txt x={() => -530 + bv[i]() * BW + 18} offsetX={-1} text={() => bv[i]().toFixed(2)} fontFamily={MONO} fontWeight={800} fontSize={32} fill={C.text} />
        </Node>
      ))}
      <Panel ref={side} x={560} y={-4} width={520} height={330} accent={C.s1} opacity={0} layout direction="column" padding={40} gap={12}>
        <Txt text="17–23 ms" fontFamily={FONT} fontWeight={850} fontSize={80} letterSpacing={-2} fill={C.s1Strong} />
        <Txt text="per step, 322M model, one 16 GB GPU" fontFamily={FONT} fontSize={23} fill={C.text2} />
        <Txt text="Operation accuracy: 0.890 at 21 ms, vs 0.861 at 4.7 s for a 27B model with a thinking budget" fontFamily={FONT} fontSize={21} lineHeight={30} fill={C.text3} textWrap width={440} />
      </Panel>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start - 0.1);
  yield* pop(loopNode(), 0.7, 0.7);
  yield loop(Infinity, () => runner(runner() + 1, 2.4, linear));

  for (const [i, phrase] of ['Is this input', 'Which tool', 'Is the task', 'Is this output'].entries()) {
    yield* at(cue(B.b2, phrase, -0.25));
    yield qLinks[i]().end(1, 0.5, easeOutCubic);
    yield rise(qRefs[i](), 0.55, 18);
  }

  // b3: milliseconds; only uncertain cases escalate
  yield* at(cue(B.b3, 'milliseconds', -0.3));
  yield* sequence(0.1, ...fast.map((f) => f().opacity(1, 0.3)));
  yield* at(cue(B.b3, 'hands only', -0.2));
  yield* pop(lowTag(), 0.4, 0.7);
  yield* draw(esc(), 0.7);
  yield* rise(s2(), 0.5, 16);

  // b4: the browser-agent fine-tune
  yield* at(B.b4.start - 0.3);
  yield* agent().opacity(0, 0.5);
  yield* browser().opacity(1, 0.4);
  yield S.note('measured', "Laya docs: browser-use agent fine-tune, top-1 element choice");
  yield* bv[0](0.1, 0.6, easeOutCubic);
  yield* at(cue(B.b4, 'to nearly', -0.2));
  yield* all(bv[1](0.63, 1.0, easeOutCubic), bv[2](0.66, 1.1, easeOutCubic));
  yield* at(cue(B.b4, 'with each step', -0.3));
  yield* rise(side(), 0.6, 20);

  yield* S.finish();
});
