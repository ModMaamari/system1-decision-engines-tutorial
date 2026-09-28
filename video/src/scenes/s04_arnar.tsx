import {Latex, Layout, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing, until} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Eyebrow, Icon, Panel, draw, pop, probBar, pulse, rise} from '../lib/ui';

export default makeScene2D(function* (view) {
  const T = timing('s04_arnar');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('The core difference', 'Autoregressive vs non-autoregressive');
  S.content.add(header.node);

  const lanes = createRef<Node>();
  S.content.add(<Node ref={lanes} />);

  // ================= top lane: generate the label, token by token ============================
  const topY = -135;
  const top = createRef<Node>();
  const topModel = createRef<Rect>();
  const topGlow = createRef<Rect>();
  const tokens = ['{"', 'department', '":', ' "', 'billing', '"}'];
  const tokRefs = tokens.map(() => createRef<Rect>());
  const topPasses = createSignal(0);
  const bad = createRef<Rect>();
  lanes().add(
    <Node ref={top} opacity={0}>
      <Eyebrow x={-840} y={topY - 95} offsetX={-1} text="AUTOREGRESSIVE · GENERATE THE LABEL" color={C.s2} />
      <Latex
        x={600}
        y={topY - 98}
        height={58}
        fill={C.text2}
        tex={'p(y_{1..T}\\mid x)=\\prod_{t} p(y_t \\mid y_{<t}, x)'}
      />
      <Panel x={-760} y={topY} width={150} height={84} radius={16} layout alignItems="center" justifyContent="center" gap={10}>
        <Icon name="message" size={26} color={C.text2} />
        <Txt text="ticket" fontFamily={FONT} fontWeight={650} fontSize={22} fill={C.text2} />
      </Panel>
      <Line points={[[-680, topY], [-600, topY]]} stroke={alpha(C.text3, 0.6)} lineWidth={3} endArrow arrowSize={10} />
      <Rect ref={topGlow} x={-500} y={topY} width={180} height={110} radius={20} shadowColor={C.s2} shadowBlur={0} fill={alpha(C.s2, 0.001)} />
      <Panel ref={topModel} x={-500} y={topY} width={180} height={110} accent={C.s2} layout direction="column" alignItems="center" justifyContent="center" gap={6}>
        <Icon name="brain" size={34} color={C.s2} />
        <Txt text="decoder" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.text} />
      </Panel>
      <Line points={[[-400, topY], [-350, topY]]} stroke={alpha(C.text3, 0.6)} lineWidth={3} endArrow arrowSize={10} />
      <Layout x={-330} y={topY} offsetX={-1} direction="row" gap={10} layout alignItems="center">
        {tokens.map((t, i) => (
          <Rect
            ref={tokRefs[i]}
            opacity={0}
            layout
            direction="column"
            alignItems="center"
            gap={4}
            padding={[10, 14]}
            radius={12}
            fill={alpha(C.s2, 0.1)}
            stroke={alpha(C.s2, 0.4)}
            lineWidth={1.5}
          >
            <Txt text={t.replace(/ /g, '␣')} fontFamily={MONO} fontWeight={600} fontSize={28} fill={C.text} />
            <Txt text={`pass ${i + 1}`} fontFamily={MONO} fontSize={15} fill={C.s2} />
          </Rect>
        ))}
      </Layout>
      <Txt x={880} y={topY - 14} offsetX={1} text={() => `${topPasses()}`} fontFamily={MONO} fontWeight={700} fontSize={64} fill={C.s2} />
      <Txt x={880} y={topY + 34} offsetX={1} text="sequential passes" fontFamily={FONT} fontSize={18} fill={C.text3} />
      <Rect
        ref={bad}
        x={-330}
        y={topY + 88}
        offsetX={-1}
        opacity={0}
        layout
        direction="row"
        alignItems="center"
        gap={12}
        padding={[8, 16]}
        radius={12}
        fill={alpha(C.bad, 0.1)}
        stroke={alpha(C.bad, 0.5)}
        lineWidth={1.5}
      >
        <Icon name="x" size={20} color={C.bad} stroke={3} />
        <Txt text={'or: "Billing dept."   "billing, probably"   {"dept": …'} fontFamily={MONO} fontSize={21} fill={C.bad} />
      </Rect>
    </Node>,
  );

  // ================= bottom lane: score every option in one pass =============================
  const botY = 150;
  const bot = createRef<Node>();
  const botModel = createRef<Rect>();
  const botGlow = createRef<Rect>();
  const options = [
    {label: 'billing', p: 0.86},
    {label: 'technical', p: 0.06},
    {label: 'sales', p: 0.03},
    {label: 'other', p: 0.05},
  ];
  const rowY = (i: number) => botY - 84 + i * 56;
  const optRefs = options.map(() => createRef<Rect>());
  const optLines = options.map(() => createRef<Line>());
  const bars = options.map((o, i) =>
    probBar({label: o.label, color: i === 0 ? C.s1 : alpha(C.s1, 0.55), width: 430, x: 220, y: rowY(i), height: 26, fontSize: 24}),
  );
  const botPasses = createSignal(0);
  const softmax = createRef<Latex>();
  const winner = createRef<Rect>();
  lanes().add(
    <Node ref={bot} opacity={0}>
      <Eyebrow x={-840} y={botY - 150} offsetX={-1} text="NON-AUTOREGRESSIVE · SCORE THE OPTIONS" color={C.s1} />
      <Latex
        ref={softmax}
        x={620}
        y={botY - 168}
        height={104}
        fill={C.text2}
        opacity={0}
        tex={'p(o_i \\mid x, q)=\\frac{e^{s_i/T}}{\\sum_{j} e^{s_j/T}}'}
      />
      {options.map((o, i) => (
        <Rect
          ref={optRefs[i]}
          x={-760}
          y={rowY(i)}
          width={160}
          height={44}
          radius={12}
          opacity={0}
          fill={alpha(C.choice, 0.1)}
          stroke={alpha(C.choice, 0.4)}
          lineWidth={1.5}
          layout
          alignItems="center"
          justifyContent="center"
        >
          <Txt text={o.label} fontFamily={MONO} fontWeight={600} fontSize={22} fill={C.choice} />
        </Rect>
      ))}
      {options.map((_, i) => (
        <Line ref={optLines[i]} points={[[-680, rowY(i)], [-590, botY]]} stroke={alpha(C.choice, 0.4)} lineWidth={2} opacity={0} />
      ))}
      <Rect ref={botGlow} x={-500} y={botY} width={180} height={150} radius={20} shadowColor={C.s1} shadowBlur={0} fill={alpha(C.s1, 0.001)} />
      <Panel ref={botModel} x={-500} y={botY} width={180} height={150} accent={C.s1} layout direction="column" alignItems="center" justifyContent="center" gap={6}>
        <Icon name="zap" size={36} color={C.s1} />
        <Txt text="encoder" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.text} />
        <Txt text="+ scorer" fontFamily={FONT} fontSize={18} fill={C.text3} />
      </Panel>
      {bars.map((b) => b.node)}
      <Rect ref={winner} x={220} y={rowY(0)} width={452} height={42} radius={21} stroke={C.s1} lineWidth={2} opacity={0} />
      <Txt x={880} y={botY - 14} offsetX={1} text={() => `${botPasses()}`} fontFamily={MONO} fontWeight={700} fontSize={64} fill={C.s1} />
      <Txt x={880} y={botY + 34} offsetX={1} text="forward pass" fontFamily={FONT} fontSize={18} fill={C.text3} />
    </Node>,
  );
  for (const b of bars) b.node.opacity(0);

  // ================= three consequences ======================================================
  const props = [
    {icon: 'check' as const, title: 'Always valid', body: 'The answer is one of your options, by construction. Nothing to parse.'},
    {icon: 'layers' as const, title: 'A probability for each', body: 'See the winner, and how close the runner-up was.'},
    {icon: 'zap' as const, title: 'Cost ignores the answer', body: 'One pass, however long the label is.'},
  ];
  const propRefs = props.map(() => createRef<Rect>());
  S.content.add(
    <Node>
      {props.map((p, i) => (
        <Panel
          ref={propRefs[i]}
          x={(i - 1) * 560}
          y={60}
          width={520}
          height={300}
          accent={C.s1}
          opacity={0}
          layout
          direction="column"
          padding={44}
          gap={22}
        >
          <Rect width={64} height={64} radius={18} fill={alpha(C.s1, 0.14)} layout alignItems="center" justifyContent="center">
            <Icon name={p.icon} size={34} color={C.s1} stroke={2.4} />
          </Rect>
          <Txt text={p.title} fontFamily={FONT} fontWeight={800} fontSize={38} fill={C.text} />
          <Txt text={p.body} fontFamily={FONT} fontSize={27} lineHeight={38} fill={C.text2} textWrap width={430} />
        </Panel>
      ))}
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield rise(top(), 0.6, 20);
  yield* waitFor(0.3);
  yield rise(bot(), 0.6, 20);

  // b2: token by token
  yield* at(cue(B.b2, 'token by token', -0.3));
  yield all(bot().opacity(0.35, 0.4));
  const step = Math.min(0.62, until(cue(B.b2, 'malformed')) / (tokens.length + 0.5));
  for (let i = 0; i < tokens.length; i++) {
    topPasses(i + 1);
    yield topGlow().shadowBlur(46, 0.08).to(0, step * 0.8);
    yield pulse(topModel(), 1.04, step * 0.9);
    yield pop(tokRefs[i](), 0.35, 0.7);
    yield* waitFor(step);
  }
  yield* at(cue(B.b2, 'malformed', -0.1));
  yield* rise(bad(), 0.5, 14);

  // b3: score the options
  yield* at(B.b3.start - 0.2);
  yield* all(top().opacity(0.35, 0.4), bot().opacity(1, 0.4));
  yield* at(cue(B.b3, 'The options', -0.1));
  yield* sequence(0.12, ...optRefs.map((r) => pop(r(), 0.45, 0.7)));
  yield* sequence(0.06, ...optLines.map((l) => draw(l(), 0.4)));
  yield* at(cue(B.b3, 'One forward pass', 0.2));
  botPasses(1);
  yield botGlow().shadowBlur(70, 0.12).to(0, 0.8);
  yield pulse(botModel(), 1.08, 0.5);
  yield* waitFor(0.15);
  for (const b of bars) b.node.opacity(1);
  yield* all(...bars.map((b, i) => b.value(options[i].p, 1.0, easeOutCubic)));
  yield* winner().opacity(1, 0.3);
  yield* at(cue(B.b3, 'softmax', -0.1));
  yield* all(softmax().opacity(1, 0.6));
  yield S.note('illustrative', 'Probabilities shown are an example');

  // b4: three consequences
  yield* at(B.b4.start - 0.3);
  yield* all(lanes().opacity(0, 0.45), S.hideNote());
  for (const [i, phrase] of ['always valid', 'Every option', 'the cost'].entries()) {
    yield* at(cue(B.b4, phrase, -0.2));
    yield rise(propRefs[i](), 0.6, 30);
  }

  yield* S.finish();
});
