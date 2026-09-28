import {Circle, Layout, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, Tag, draw, pop, pulse, rise} from '../lib/ui';

export default makeScene2D(function* (view) {
  const T = timing('s02_problem');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('The default today', 'The generation tax', C.s2);
  S.content.add(header.node);

  // --- the ticket ---------------------------------------------------------------------------
  const ticket = createRef<Rect>();
  S.content.add(
    <Panel ref={ticket} x={-600} y={40} width={460} opacity={0} layout direction="column" padding={34} gap={18}>
      <Layout direction="row" gap={12} alignItems="center">
        <Icon name="message" size={24} color={C.text3} />
        <Txt text="Support ticket #4411" fontFamily={FONT} fontWeight={650} fontSize={22} fill={C.text3} />
      </Layout>
      <Txt
        text="Hi, we were billed twice for March. Please refund the duplicate today or we will cancel our plan."
        fontFamily={FONT}
        fontSize={29}
        lineHeight={42}
        fill={C.text}
        textWrap
        width={392}
      />
    </Panel>,
  );

  // --- the LLM ------------------------------------------------------------------------------
  const llm = createRef<Rect>();
  const llmGlow = createRef<Rect>();
  S.content.add(
    <Node>
      <Rect ref={llmGlow} x={-80} y={-60} width={300} height={200} radius={28} fill={alpha(C.s2, 0.0)} shadowColor={C.s2} shadowBlur={0} />
      <Panel ref={llm} x={-80} y={-60} width={300} height={200} accent={C.s2} opacity={0} layout direction="column" alignItems="center" justifyContent="center" gap={14}>
        <Icon name="brain" size={52} color={C.s2} stroke={1.8} />
        <Txt text="Large language model" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.text} />
        <Tag text="System 2 · generates text" color={C.s2} size={16} />
      </Panel>
    </Node>,
  );
  const arrowIn = createRef<Line>();
  S.content.add(
    <Line ref={arrowIn} points={[[-360, -20], [-240, -50]]} stroke={alpha(C.text3, 0.7)} lineWidth={3} endArrow arrowSize={12} opacity={0} />,
  );

  // --- token-by-token output ----------------------------------------------------------------
  const tokens = ['{"', 'department', '":', ' "', 'Bill', 'ing', ' dept', '."', '}'];
  const out = createRef<Rect>();
  const outText = createRef<Txt>();
  const passes = createSignal(0);
  const arrowOut = createRef<Line>();
  S.content.add(
    <Node>
      <Line ref={arrowOut} points={[[80, -60], [210, -60]]} stroke={alpha(C.text3, 0.7)} lineWidth={3} endArrow arrowSize={12} opacity={0} />
      <Panel ref={out} x={560} y={-60} width={640} height={200} opacity={0} layout direction="column" padding={[26, 32]} gap={16}>
        <Layout direction="row" justifyContent="space-between" width={576}>
          <Txt text="OUTPUT, ONE TOKEN PER PASS" fontFamily={FONT} fontWeight={700} fontSize={15} letterSpacing={3} fill={C.text3} />
          <Txt text={() => `pass ${passes()}`} fontFamily={MONO} fontWeight={600} fontSize={20} fill={C.s2} />
        </Layout>
        <Txt ref={outText} text="" fontFamily={MONO} fontWeight={500} fontSize={30} fill={C.text} />
      </Panel>
    </Node>,
  );

  // --- parse, validate, retry ---------------------------------------------------------------
  const steps = [
    {label: 'parse', detail: 'JSON ok', icon: 'check' as const, color: C.good},
    {label: 'validate', detail: '"Billing dept." not in {billing, technical, other}', icon: 'x' as const, color: C.bad},
    {label: 'retry', detail: 'call the model again', icon: 'refresh' as const, color: C.score},
  ];
  const stepRefs = steps.map(() => createRef<Rect>());
  const stepIcons = steps.map(() => createRef<Rect>());
  S.content.add(
    <Node>
      {steps.map((s, i) => (
        <Panel
          ref={stepRefs[i]}
          x={560}
          y={140 + i * 104}
          width={640}
          height={84}
          radius={18}
          opacity={0}
          layout
          direction="row"
          alignItems="center"
          padding={[0, 28]}
          gap={20}
        >
          <Rect width={44} height={44} radius={22} fill={alpha(s.color, 0.15)} layout alignItems="center" justifyContent="center">
            <Icon ref={stepIcons[i]} name={s.icon} size={24} color={s.color} stroke={2.6} />
          </Rect>
          <Txt text={s.label} fontFamily={MONO} fontWeight={700} fontSize={28} fill={C.text} width={140} />
          <Txt text={s.detail} fontFamily={FONT} fontSize={21} fill={C.text2} textWrap width={380} />
        </Panel>
      ))}
    </Node>,
  );
  const retryLoop = createRef<Line>();
  S.content.add(
    <Line
      ref={retryLoop}
      points={[[240, 348], [-80, 348], [-80, 48]]}
      radius={40}
      stroke={C.score}
      lineWidth={3}
      lineDash={[10, 10]}
      endArrow
      arrowSize={12}
      opacity={0}
    />,
  );

  // --- the punchline ------------------------------------------------------------------------
  const three = createRef<Layout>();
  S.content.add(
    <Layout ref={three} x={-600} y={330} direction="column" gap={16} alignItems="center" opacity={0} layout>
      <Txt text="for a decision with only three answers" fontFamily={FONT} fontWeight={650} fontSize={28} fill={C.text2} />
      <Layout direction="row" gap={14}>
        {['billing', 'technical', 'other'].map((l) => (
          <Rect layout padding={[10, 20]} radius={14} fill={alpha(C.choice, 0.12)} stroke={alpha(C.choice, 0.45)} lineWidth={1.5}>
            <Txt text={l} fontFamily={MONO} fontSize={30} fontWeight={600} fill={C.choice} />
          </Rect>
        ))}
      </Layout>
    </Layout>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start - 0.2);
  yield rise(ticket(), 0.7);
  yield* waitFor(0.4);
  yield draw(arrowIn(), 0.5);
  yield* at(cue(B.b1, 'large language'));
  yield* pop(llm(), 0.6, 0.85);

  // b2: one token at a time
  yield* at(B.b2.start);
  yield draw(arrowOut(), 0.4);
  yield* rise(out(), 0.5, 20);
  const tokenTime = Math.min(0.42, (cue(B.b2, 'Then your code') - B.b2.start - 0.9) / tokens.length);
  let text = '';
  for (const tok of tokens) {
    text += tok;
    passes(passes() + 1);
    yield llmGlow().shadowBlur(40, 0.08).to(0, tokenTime * 0.8);
    yield pulse(llm(), 1.03, tokenTime * 0.9);
    outText().text(text);
    yield* waitFor(tokenTime);
  }
  yield* at(cue(B.b2, 'parses'));
  yield* rise(stepRefs[0](), 0.5, 20);
  yield* at(cue(B.b2, 'checks'));
  yield* rise(stepRefs[1](), 0.5, 20);
  yield chain(
    stepRefs[1]().x(572, 0.06),
    stepRefs[1]().x(548, 0.08),
    stepRefs[1]().x(566, 0.08),
    stepRefs[1]().x(560, 0.06),
  );
  yield stepRefs[1]().stroke(alpha(C.bad, 0.6), 0.3);
  yield* at(cue(B.b2, 'retries'));
  yield* rise(stepRefs[2](), 0.5, 20);
  yield draw(retryLoop(), 0.9);
  yield stepIcons[2]().rotation(-360, 1.2, easeInOutCubic);

  // b3: a full generation, a parser and a retry path, for three answers
  yield* at(B.b3.start);
  yield* sequence(
    0.9,
    pulse(out(), 1.04, 0.6),
    pulse(stepRefs[0](), 1.05, 0.6),
    all(pulse(stepRefs[2](), 1.05, 0.6), retryLoop().lineWidth(5, 0.3).to(3, 0.3)),
  );
  yield* at(cue(B.b3, 'only three'));
  yield* all(three().opacity(1, 0.6, easeOutCubic), three().y(310, 0.6, easeOutCubic));
  yield S.note('illustrative', 'A typical generate-parse-validate loop');

  yield* S.finish();
});
