import {CubicBezier, Layout, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor, type Reference} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Eyebrow, Tag, pop, pulse, rise} from '../lib/ui';

type Kind = 'special' | 'mask' | 'header' | 'option' | 'state';

function seg(text: string, kind: Kind, ref?: Reference<Rect>, shown = false) {
  const style = {
    special: {fill: alpha('#94a3b8', 0.1), stroke: alpha('#94a3b8', 0.35), color: C.text3, font: MONO},
    mask: {fill: alpha(C.s1, 0.16), stroke: alpha(C.s1, 0.7), color: C.s1Strong, font: MONO},
    header: {fill: alpha('#94a3b8', 0.08), stroke: alpha('#94a3b8', 0.25), color: C.text, font: FONT},
    option: {fill: alpha(C.choice, 0.1), stroke: alpha(C.choice, 0.4), color: C.choice, font: FONT},
    state: {fill: alpha(C.score, 0.07), stroke: alpha(C.score, 0.3), color: C.text2, font: MONO},
  }[kind];
  return (
    <Rect
      ref={ref}
      layout
      padding={[12, 14]}
      radius={10}
      fill={style.fill}
      stroke={style.stroke}
      lineWidth={1.5}
      opacity={shown ? 1 : 0}
      shadowColor={kind === 'mask' ? C.s1 : 'rgba(0,0,0,0)'}
      shadowBlur={kind === 'mask' ? 16 : 0}
    >
      <Txt text={text} fontFamily={style.font} fontWeight={kind === 'special' || kind === 'mask' ? 700 : 550} fontSize={23} fill={style.color} />
    </Rect>
  );
}

export default makeScene2D(function* (view) {
  const T = timing('s06_sequence');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Inside the engine', 'Building the input sequence');
  S.content.add(header.node);

  // --- one row per question -------------------------------------------------------------------
  const rows = createRef<Node>();
  const r1 = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const r2 = Array.from({length: 7}, () => createRef<Rect>());
  const r3 = [createRef<Rect>(), createRef<Rect>()];
  const labels = [createRef<Txt>(), createRef<Txt>(), createRef<Txt>()];
  const X0 = -860;
  S.content.add(
    <Node ref={rows}>
      <Eyebrow ref={labels[0]} x={X0} y={-232} offsetX={-1} text="HEADER" color={C.text3} opacity={0} />
      <Layout x={X0} y={-180} offsetX={-1} direction="row" gap={8} layout>
        {seg('[CLS]', 'special', r1[0])}
        {seg('choice question: Which department should handle this request?', 'header', r1[1])}
        {seg('[SEP]', 'special', r1[2])}
      </Layout>
      <Eyebrow ref={labels[1]} x={X0} y={-102} offsetX={-1} text="OPTIONS, EACH AFTER A MARKER" color={C.choice} opacity={0} />
      <Layout x={X0} y={-50} offsetX={-1} direction="row" gap={8} layout>
        {seg('[MASK]', 'mask', r2[0])}
        {seg('billing: invoices, payments, refunds', 'option', r2[1])}
        {seg('[MASK]', 'mask', r2[2])}
        {seg('technical: bugs, outages, errors', 'option', r2[3])}
        {seg('[MASK]', 'mask', r2[4])}
        {seg('other: everything else', 'option', r2[5])}
        {seg('[SEP]', 'special', r2[6])}
      </Layout>
      <Eyebrow ref={labels[2]} x={X0} y={28} offsetX={-1} text="STATE: THE INPUT ITSELF" color={C.score} opacity={0} />
      <Layout x={X0} y={80} offsetX={-1} direction="row" gap={8} layout>
        {seg('{"subject": "Duplicate charge on invoice #4411", "body": "Hi, we were billed twice…"}', 'state', r3[0])}
        {seg('[SEP]', 'special', r3[1])}
      </Layout>
    </Node>,
  );
  const masks = [r2[0], r2[2], r2[4]];
  const arcs = createRef<Node>();
  S.content.add(<Node ref={arcs} />);
  const caption = createRef<Txt>();
  S.content.add(
    <Txt ref={caption} y={230} text="" fontFamily={FONT} fontWeight={600} fontSize={32} fill={C.text2} opacity={0} />,
  );

  // --- the budget -----------------------------------------------------------------------------
  const budget = createRef<Node>();
  const barW = 1500;
  const nOpts = createSignal(3);
  const budgetTitle = createRef<Txt>();
  const barCaption = createRef<Txt>();
  const formula = createRef<Rect>();
  const trunc = createRef<Node>();
  const same = createRef<Rect>();
  const rule = createRef<Rect>();
  const slivers = createRef<Node>();
  S.content.add(
    <Node ref={budget} opacity={0}>
      <Txt ref={budgetTitle} x={-750} y={-215} offsetX={-1} text="All options share one head budget" fontFamily={FONT} fontWeight={800} fontSize={44} fill={C.text} />
      <Txt x={750} y={-212} offsetX={1} text="head_max_len = 256 tokens" fontFamily={MONO} fontWeight={600} fontSize={26} fill={C.text3} />
      <Rect y={-120} width={barW} height={64} radius={14} fill={alpha('#94a3b8', 0.07)} stroke={alpha('#94a3b8', 0.2)} lineWidth={1.5} />
      <Rect x={-barW / 2} y={-120} offsetX={-1} width={(16 / 256) * barW} height={64} radius={[14, 0, 0, 14]} fill={alpha('#94a3b8', 0.3)} />
      <Node ref={slivers} />
      <Txt ref={barCaption} x={-750} y={-60} offsetX={-1} text="" fontFamily={FONT} fontSize={26} fill={C.text2} />
      <Rect ref={formula} y={20} layout padding={[14, 26]} radius={14} fill={alpha(C.score, 0.1)} stroke={alpha(C.score, 0.45)} lineWidth={1.5} opacity={0}>
        <Txt text="per option = max(4, ⌊(256 − 16) / 77⌋) = 4 tokens, marker included" fontFamily={MONO} fontWeight={600} fontSize={27} fill={C.score} />
      </Rect>
      <Node ref={trunc} y={150} opacity={0}>
        {[
          'card_payment_not_recognised',
          'card_payment_fee_charged',
        ].map((label, i) => (
          <Node y={i * 74}>
            <Txt x={-120} offsetX={1} text={label} fontFamily={MONO} fontSize={28} fill={C.text2} />
            <Txt x={-70} text="→" fontFamily={FONT} fontSize={30} fill={C.text3} />
            <Layout x={-20} offsetX={-1} direction="row" gap={8} layout>
              {seg('[MASK]', 'mask', undefined, true)}
              {seg('card', 'option', undefined, true)}
              {seg('_pay', 'option', undefined, true)}
              {seg('ment', 'option', undefined, true)}
            </Layout>
          </Node>
        ))}
        <Rect ref={same} x={600} y={37} layout padding={[10, 20]} radius={12} fill={alpha(C.bad, 0.14)} stroke={alpha(C.bad, 0.6)} lineWidth={2} opacity={0}>
          <Txt text="identical to the model" fontFamily={FONT} fontWeight={700} fontSize={25} fill={C.bad} />
        </Rect>
      </Node>
      <Rect ref={rule} y={345} layout padding={[16, 34]} radius={999} fill={alpha(C.s1, 0.14)} stroke={alpha(C.s1, 0.7)} lineWidth={2} opacity={0} shadowColor={C.s1} shadowBlur={24}>
        <Txt text="Rule of thumb: keep choice questions under ~20 options" fontFamily={FONT} fontWeight={750} fontSize={32} fill={C.s1Strong} />
      </Rect>
    </Node>,
  );

  const drawSlivers = (n: number, perTokens: number) => {
    slivers().removeChildren();
    const x0 = -barW / 2 + (16 / 256) * barW;
    const avail = barW - (16 / 256) * barW;
    const w = n <= 5 ? ((perTokens / 256) * barW) : avail / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w;
      slivers().add(
        <Node>
          <Rect x={x + 1} y={-120} offsetX={-1} width={Math.max(1, w - 2)} height={56} radius={n > 20 ? 2 : 8} fill={alpha(C.choice, 0.45)} />
          <Rect x={x + 1} y={-120} offsetX={-1} width={Math.max(1.5, Math.min(w * 0.22, 14))} height={56} radius={n > 20 ? 1 : [8, 0, 0, 8]} fill={C.s1} />
        </Node>,
      );
    }
  };

  // ================================================================ timeline
  yield header.in();

  // b1: build the row
  yield* at(B.b1.start);
  const all1 = [...r1, ...r2, ...r3];
  yield* sequence(0.07, ...all1.map((r) => pop(r(), 0.4, 0.8)));

  // b2: header, options with markers, state
  yield* at(cue(B.b2, 'A header', -0.1));
  yield labels[0]().opacity(1, 0.4);
  yield* pulse(r1[1](), 1.04, 0.6);
  yield* at(cue(B.b2, 'Then every option', -0.1));
  yield labels[1]().opacity(1, 0.4);
  yield* sequence(0.15, ...[r2[1], r2[3], r2[5]].map((r) => pulse(r(), 1.05, 0.5)));
  yield* at(cue(B.b2, 'mask token', -0.1));
  yield* sequence(0.15, ...masks.map((m) => all(pulse(m(), 1.15, 0.5), m().shadowBlur(40, 0.25).to(16, 0.4))));
  yield* at(cue(B.b2, 'Then the input', -0.1));
  yield labels[2]().opacity(1, 0.4);
  yield* pulse(r3[0](), 1.03, 0.6);

  // b3: bidirectional attention from one marker
  yield* at(B.b3.start);
  // absolutePosition() is in canvas pixels; bring it into the arcs layer's own coordinates.
  const local = (r: Reference<Rect>) => r().absolutePosition().transformAsPoint(arcs().worldToLocal());
  const from = local(masks[0]);
  const targets = [r2[1], r1[1], r2[3], r2[5], r3[0]].map(local);
  const curves = targets.map((to, i) => {
    const up = to.y < from.y - 20;
    const down = to.y > from.y + 20;
    const lift = up ? -90 : down ? 90 : -110 - i * 18;
    const c = (
      <CubicBezier
        p0={[from.x, from.y + (down ? 22 : -22)]}
        p1={[from.x + (to.x - from.x) * 0.25, from.y + lift]}
        p2={[to.x - (to.x - from.x) * 0.25, to.y + (up ? 60 : down ? -60 : lift)]}
        p3={[to.x, to.y + (up ? 24 : down ? -24 : -22)]}
        stroke={C.s1}
        lineWidth={3}
        end={0}
        endArrow
        arrowSize={10}
        opacity={0.85}
        shadowColor={C.s1}
        shadowBlur={10}
      />
    ) as CubicBezier;
    arcs().add(c);
    return c;
  });
  yield* sequence(0.12, ...curves.map((c) => c.end(1, 0.7, easeOutCubic)));
  yield* at(cue(B.b3, 'all at once', -0.2));
  caption().text('every marker sees everything, in one pass');
  yield caption().opacity(1, 0.5);
  yield* all(...curves.map((c) => c.lineWidth(5, 0.3).to(3, 0.4)));

  // b4: the shared token budget
  yield* at(B.b4.start - 0.3);
  yield* all(rows().opacity(0, 0.4), arcs().opacity(0, 0.4), caption().opacity(0, 0.4));
  drawSlivers(3, 49);
  barCaption().text('3 options: each keeps up to 48 tokens of text');
  yield* rise(budget(), 0.6, 20);
  yield* at(cue(B.b4, 'With seventy', -0.2));
  yield* slivers().opacity(0, 0.25);
  nOpts(77);
  drawSlivers(77, 4);
  barCaption().text('77 options: every option is cut to the same few tokens');
  yield* slivers().opacity(1, 0.35);
  yield* pop(formula(), 0.5, 0.85);
  yield* at(cue(B.b4, 'each label keeps', -0.1));
  yield* rise(trunc(), 0.6, 20);
  yield* at(cue(B.b4, 'collapse', -0.2));
  yield* pop(same(), 0.5, 0.7);
  yield S.note('measured', 'Banking77 (77 labels): both base checkpoints score 0.425 · token split illustrative');
  yield* at(cue(B.b4, 'The rule', -0.2));
  yield* pop(rule(), 0.6, 0.8);

  yield* S.finish();
});
