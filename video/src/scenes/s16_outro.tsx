import {Circle, Node, Rect, Txt, makeScene2D, Gradient} from '@motion-canvas/2d';
import {all, createRef, easeInCubic, easeInOutCubic, easeOutCubic, sequence} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Eyebrow, maskedText, pop, rise} from '../lib/ui';

export default makeScene2D(function* (view) {
  const T = timing('s16_outro');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  // b1 and b2: the two lines
  const l1 = maskedText({
    width: 1700,
    fontFamily: FONT,
    fontWeight: 850,
    fontSize: 104,
    letterSpacing: -3,
    fill: C.text,
    children: ['Let ', <Txt fill={C.s1Strong}>System 1</Txt>, ' answer first'],
  });
  const l1b = createRef<Txt>();
  const l2 = maskedText({
    width: 1700,
    fontFamily: FONT,
    fontWeight: 850,
    fontSize: 84,
    letterSpacing: -2.5,
    fill: C.text,
    children: ['Let confidence decide when to ', <Txt fill={C.s2}>think slow</Txt>],
  });
  l1.node.y(-150);
  l2.node.y(110);
  const lines = createRef<Node>();
  S.content.add(
    <Node ref={lines}>
      {l1.node}
      <Txt ref={l1b} y={-40} text="in one pass, with honest probabilities" fontFamily={FONT} fontWeight={550} fontSize={38} fill={C.s1Strong} opacity={0} />
      {l2.node}
    </Node>,
  );

  // b3: end card
  const card = createRef<Node>();
  const logo = createRef<Rect>();
  const t1 = createRef<Txt>();
  const t2 = createRef<Txt>();
  const meta = createRef<Node>();
  S.content.add(
    <Node ref={card} y={-20}>
      <Rect ref={logo} y={-240} width={110} height={110} radius={30} fill={C.s1Deep} opacity={0} shadowColor={alpha(C.s1, 0.6)} shadowBlur={60}>
        <Circle x={20} size={34} fill="#ecfeff" />
        <Rect x={-20} width={30} height={11} radius={5.5} fill="#ecfeff" />
      </Rect>
      <Txt
        ref={t1}
        y={-95}
        text="System 1"
        fontFamily={FONT}
        fontWeight={850}
        fontSize={120}
        letterSpacing={-4}
        opacity={0}
        fill={new Gradient({fromX: -260, toX: 260, stops: [{offset: 0, color: C.s1Strong}, {offset: 1, color: '#38bdf8'}]})}
      />
      <Txt ref={t2} y={45} text="Decision Engines" fontFamily={FONT} fontWeight={850} fontSize={120} letterSpacing={-4} fill={C.text} opacity={0} />
      <Node ref={meta} y={180} opacity={0}>
        <Eyebrow text="AN INTERACTIVE TUTORIAL · 18 CHAPTERS · HANDS-ON FIGURES" color={C.text2} />
        <Txt y={52} text="github.com/ModMaamari/system1-decision-engines-tutorial" fontFamily={MONO} fontWeight={600} fontSize={28} fill={C.s1Strong} />
        <Txt y={104} text="Reference implementation: Laya by Convai Innovations (Apache 2.0). Independent educational project." fontFamily={FONT} fontSize={21} fill={C.text3} />
      </Node>
    </Node>,
  );

  // ================================================================ timeline
  yield* at(B.b1.start - 0.1);
  yield* l1.in(0.8);
  yield* at(cue(B.b1, 'in one pass', -0.2));
  yield* rise(l1b(), 0.6, 16);

  yield* at(B.b2.start - 0.1);
  yield* l2.in(0.8);

  yield* at(B.b3.start - 0.35);
  yield* all(lines().opacity(0, 0.5), lines().scale(0.96, 0.5, easeInCubic));
  yield* pop(logo(), 0.6, 0.5);
  yield* sequence(0.2, rise(t1(), 0.7, 30), rise(t2(), 0.7, 30));
  yield* at(cue(B.b3, 'Explore', -0.2));
  yield* rise(meta(), 0.7, 20);

  yield* S.finish({fadeToBlack: true});
});
