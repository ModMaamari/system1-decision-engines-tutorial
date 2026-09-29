import {Circle, Layout, Node, Rect, Txt, makeScene2D, Gradient} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  linear,
  sequence,
  useRandom,
  type Reference,
} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, H, MONO, W, alpha} from '../lib/theme';
import {Eyebrow, Panel, Tag, maskedText, pop, pulse, rise} from '../lib/ui';

interface Card {
  node: Reference<Rect>;
  question: Reference<Txt>;
  chips: Reference<Layout>;
}

export default makeScene2D(function* (view) {
  const T = timing('s01_open');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();
  S.hud.opacity(0);

  // --- a field of tiny decisions, twinkling -------------------------------------------------
  const random = useRandom(11);
  const tt = createSignal(0);
  const field = createRef<Node>();
  const palette = [C.s1, C.choice, C.noul, C.score, C.s1];
  const cols = 40;
  const rows = 15;
  S.content.add(<Node ref={field} />);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * 44;
      const y = (r - (rows - 1) / 2) * 44;
      const phase = random.nextFloat(0, Math.PI * 2);
      const speed = random.nextFloat(0.7, 1.6);
      const color = palette[random.nextInt(0, palette.length)];
      const edge = Math.hypot(x / 900, y / 340);
      field().add(
        <Circle
          x={x}
          y={y}
          size={7}
          fill={color}
          opacity={() => {
            const reveal = Math.min(1, Math.max(0, (tt() * 1100 - (x + 900) - y * 0.3) / 260));
            const flash = Math.pow(Math.max(0, Math.sin(tt() * speed * 2.2 + phase)), 10);
            return reveal * (0.1 + 0.9 * flash) * Math.max(0, 1.15 - edge * 0.75);
          }}
        />,
      );
    }
  }
  yield tt(T.duration, T.duration, linear);

  const hook = maskedText({
    width: 1600,
    text: 'thousands of small decisions',
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: 92,
    letterSpacing: -2,
    fill: C.text,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 30,
  });
  const hookEyebrow = createRef<Txt>();
  S.content.add(
    <Node>
      <Eyebrow ref={hookEyebrow} y={-96} text="EVERY SECOND" opacity={0} />
      {hook.node}
    </Node>,
  );

  // --- three typed questions -----------------------------------------------------------------
  const cardSpecs = [
    {type: 'CHOICE', color: C.choice, q: 'Which team should get this ticket?', chips: ['billing', 'technical', 'other']},
    {type: 'NOUL', color: C.noul, q: 'Is this prompt a jailbreak?', chips: ['false', 'true']},
    {type: 'SCORE', color: C.score, q: 'How urgent is this email?', chips: ['not urgent', 'soon', 'blocking']},
  ];
  const cards: Card[] = cardSpecs.map(() => ({node: createRef<Rect>(), question: createRef<Txt>(), chips: createRef<Layout>()}));
  const cardsLayer = createRef<Node>();
  S.content.add(
    <Node ref={cardsLayer}>
      {cardSpecs.map((spec, i) => (
        <Panel
          ref={cards[i].node}
          x={(i - 1) * 580}
          y={30}
          width={540}
          height={330}
          accent={spec.color}
          opacity={0}
          layout
          direction="column"
          padding={40}
          gap={26}
          alignItems="start"
        >
          <Tag text={spec.type} color={spec.color} size={17} />
          <Txt
            ref={cards[i].question}
            text={spec.q}
            fontFamily={FONT}
            fontWeight={700}
            fontSize={38}
            lineHeight={50}
            fill={C.text}
            textWrap
            width={460}
          />
          <Layout ref={cards[i].chips} direction="row" gap={12} wrap="wrap" width={460}>
            {spec.chips.map((c) => (
              <Rect
                layout
                padding={[9, 16]}
                radius={12}
                fill={alpha(spec.color, 0.1)}
                stroke={alpha(spec.color, 0.35)}
                lineWidth={1.5}
              >
                <Txt text={c} fontFamily={MONO} fontSize={22} fontWeight={600} fill={spec.color} />
              </Rect>
            ))}
          </Layout>
        </Panel>
      ))}
    </Node>,
  );
  const knownLabel = createRef<Txt>();
  S.content.add(
    <Txt
      ref={knownLabel}
      y={-250}
      text="Not open questions: a small, known set of answers"
      fontFamily={FONT}
      fontWeight={650}
      fontSize={34}
      fill={C.text2}
      opacity={0}
    />,
  );

  // --- title ---------------------------------------------------------------------------------
  const ring = createRef<Circle>();
  const eyebrow = createRef<Txt>();
  const line1 = maskedText({
    width: 1500,
    text: 'System 1',
    fontFamily: FONT,
    fontWeight: 850,
    fontSize: 156,
    letterSpacing: -5,
    fill: new Gradient({
      fromX: -300,
      toX: 300,
      stops: [
        {offset: 0, color: C.s1Strong},
        {offset: 1, color: '#38bdf8'},
      ],
    }),
    shadowColor: alpha(C.s1, 0.35),
    shadowBlur: 50,
  });
  const line2 = maskedText({
    width: 1500,
    text: 'Decision Engines',
    fontFamily: FONT,
    fontWeight: 850,
    fontSize: 156,
    letterSpacing: -5,
    fill: C.text,
  });
  line1.node.y(-95);
  line2.node.y(90);
  const subtitle = createRef<Layout>();
  const subtitleTags = ['typed questions', 'one forward pass', 'a probability for every answer'];
  const tagRefs = subtitleTags.map(() => createRef<Rect>());
  const laya = createRef<Rect>();
  S.content.add(
    <Node>
      <Circle ref={ring} size={40} stroke={C.s1} lineWidth={3} opacity={0} />
      <Eyebrow ref={eyebrow} y={-230} text="NON-AUTOREGRESSIVE" opacity={0} />
      {line1.node}
      {line2.node}
      <Layout ref={subtitle} y={250} direction="row" gap={18} layout>
        {subtitleTags.map((t, i) => (
          <Tag ref={tagRefs[i]} text={t} color={[C.s1, C.choice, C.noul][i]} size={26} opacity={0} />
        ))}
      </Layout>
      <Panel
        ref={laya}
        y={392}
        opacity={0}
        layout
        direction="row"
        alignItems="center"
        gap={22}
        padding={[18, 30]}
        radius={18}
        accent={C.s1}
      >
        <Txt text="REFERENCE IMPLEMENTATION" fontFamily={FONT} fontWeight={700} fontSize={16} letterSpacing={3} fill={C.text3} />
        <Txt text="Laya" fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.text} />
        <Txt text="open source · multilingual · Apache 2.0" fontFamily={FONT} fontSize={24} fill={C.text2} />
      </Panel>
    </Node>,
  );

  // ================================================================ timeline
  const black = createRef<Rect>();
  view.add(<Rect ref={black} width={W} height={H} fill="#000" />);
  yield black().opacity(0, 1.6, easeInOutCubic);

  // b1: every second, thousands of small decisions
  yield* at(B.b1.start + 0.1);
  yield hookEyebrow().opacity(1, 0.6);
  yield* at(cue(B.b1, 'thousands'));
  yield* hook.in(0.9);

  // b2: three questions arrive
  yield* at(B.b2.start - 0.25);
  yield all(hook.out(0.5), hookEyebrow().opacity(0, 0.4), field().opacity(0.35, 1.2));
  for (const [i, phrase] of ['Which team', 'Is this prompt', 'How urgent'].entries()) {
    yield* at(cue(B.b2, phrase, -0.15));
    const node = cards[i].node();
    node.y(90);
    yield all(node.opacity(1, 0.6, easeOutCubic), node.y(30, 0.8, easeOutCubic));
  }

  // b3: not open questions; a small, known set of answers
  yield* at(B.b3.start);
  yield all(...cards.map((c) => c.question().opacity(0.35, 0.6)), field().opacity(0.2, 1));
  yield* at(cue(B.b3, 'Each has'));
  yield knownLabel().opacity(1, 0.6);
  yield* sequence(
    0.12,
    ...cards.map((c) => pulse(c.chips(), 1.07, 0.6)),
  );
  yield* at(cue(B.b3, 'deserves'));
  yield* all(
    ...cards.map((c) => c.question().opacity(1, 0.5)),
    ...cards.map((c, i) => c.node().rotation((i - 1) * -3, 1.2, easeInOutCubic)),
    ...cards.map((c) => c.node().scale(0.94, 1.2, easeInOutCubic)),
  );

  // b4: the title
  yield* at(B.b4.start - 0.45);
  yield* all(
    knownLabel().opacity(0, 0.35),
    ...cards.map((c) =>
      all(c.node().position([0, 0], 0.55, easeInCubic), c.node().scale(0.2, 0.55, easeInCubic), c.node().opacity(0, 0.55, easeInCubic)),
    ),
    field().opacity(0.12, 0.6),
  );
  ring().opacity(0.9);
  yield all(ring().size(1400, 1.4, easeOutCubic), ring().opacity(0, 1.4, easeOutCubic), ring().lineWidth(1, 1.4));
  yield S.hud.opacity(1, 1);
  yield eyebrow().opacity(1, 0.6);
  yield line1.in(0.9);
  yield* at(cue(B.b4, 'decision engines', 0.05));
  yield* line2.in(0.9);
  for (const [i, phrase] of ['typed questions', 'single forward pass', 'probability for every'].entries()) {
    yield* at(cue(B.b4, phrase, -0.1));
    yield pop(tagRefs[i](), 0.55, 0.7);
  }

  // b5: Laya
  yield* at(cue(B.b5, 'Laya', -0.2));
  yield* rise(laya(), 0.7, 30);
  yield S.note('source', 'Laya: github.com/NandhaKishorM/laya · by Convai Innovations');

  yield* S.finish();
});
