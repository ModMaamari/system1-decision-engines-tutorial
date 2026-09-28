import {Circle, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {ARABIC, C, DEVANAGARI, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, pop, pulse, rise, travel} from '../lib/ui';

const RX = -200; // router
const RY = 20;
const CKX = 470; // checkpoint cards
const CKY = [-170, 20, 210];

export default makeScene2D(function* (view) {
  const T = timing('s12_router');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Using it', 'Three checkpoints and a router');
  S.content.add(header.node);

  const diagram = createRef<Node>();
  S.content.add(<Node ref={diagram} />);

  // router
  const router = createRef<Node>();
  diagram().add(
    <Node ref={router} x={RX} y={RY} opacity={0}>
      <Rect width={170} height={170} rotation={45} radius={26} fill={alpha(C.surface2, 0.95)} stroke={C.s1} lineWidth={2.5} shadowColor={alpha(C.s1, 0.5)} shadowBlur={30} />
      <Icon y={-26} name="route" size={36} color={C.s1} />
      <Txt y={20} text="Router" fontFamily={FONT} fontWeight={800} fontSize={28} fill={C.text} />
      <Txt y={150} text="script + language" fontFamily={FONT} fontWeight={600} fontSize={21} fill={C.text2} />
      <Txt y={180} text="< 0.5 ms, before the pass" fontFamily={MONO} fontSize={18} fill={C.s1} />
    </Node>,
  );

  // checkpoints
  const cks = [
    {name: 'laya', sub: 'English', detail: 'ModernBERT-large · 421M', color: C.choice},
    {name: 'laya-multilingual', sub: '100+ languages · ≈2× faster', detail: 'mmBERT-base · 322M', color: C.s1},
    {name: 'laya-typed-decisions', sub: 'four fine-tuned workflows', detail: 'ModernBERT-large · 421M', color: C.noul},
  ];
  const ckRefs = cks.map(() => createRef<Rect>());
  const links = cks.map(() => createRef<Line>());
  cks.forEach((c, i) => {
    diagram().add(
      <Line ref={links[i]} points={[[RX + 120, RY], [RX + 260, RY], [RX + 260, CKY[i]], [CKX - 300, CKY[i]]]} radius={24} stroke={alpha(c.color, 0.5)} lineWidth={3} end={0} endArrow arrowSize={10} />,
    );
    diagram().add(
      <Panel ref={ckRefs[i]} x={CKX} y={CKY[i]} width={560} height={150} accent={c.color} opacity={0} layout direction="column" justifyContent="center" padding={[0, 36]} gap={6}>
        <Txt text={c.name} fontFamily={MONO} fontWeight={800} fontSize={32} fill={c.color} />
        <Txt text={c.sub} fontFamily={FONT} fontWeight={650} fontSize={25} fill={C.text} />
        <Txt text={c.detail} fontFamily={FONT} fontSize={20} fill={C.text3} />
      </Panel>,
    );
  });

  // inputs
  const inputs = [
    {text: 'Hi, we were billed twice', font: FONT, target: 0},
    {text: 'Der Kunde wurde zweimal belastet', font: FONT, target: 1},
    {text: 'मुझसे दो बार शुल्क लिया गया', font: DEVANAGARI, target: 1},
    {text: 'تم خصم المبلغ مرتين', font: ARABIC, target: 1},
  ];
  const inRefs = inputs.map(() => createRef<Rect>());
  const IX = -670;
  const IY = (i: number) => -150 + i * 112;
  inputs.forEach((inp, i) => {
    diagram().add(
      <Rect ref={inRefs[i]} x={IX} y={IY(i)} width={440} height={84} radius={16} fill={alpha(C.surface, 0.85)} stroke={alpha('#94a3b8', 0.2)} lineWidth={1.5} opacity={0} layout alignItems="center" justifyContent="center">
        <Txt text={inp.text} fontFamily={inp.font} fontWeight={500} fontSize={inp.font === FONT ? 24 : 27} fill={C.text} />
      </Rect>,
    );
  });
  const dots = createRef<Node>();
  diagram().add(<Node ref={dots} />);

  // stat
  const stat = createRef<Node>();
  const en = createSignal(0);
  const routed = createSignal(0);
  S.content.add(
    <Panel ref={stat} y={60} width={1400} height={420} opacity={0}>
      <Txt y={-150} text="Languages usable out of 51 (above 3× random)" fontFamily={FONT} fontWeight={700} fontSize={32} fill={C.text} />
      {[
        {label: 'English checkpoint only', v: en, color: C.choice, y: -40},
        {label: 'with the router', v: routed, color: C.s1, y: 80},
      ].map((r) => (
        <Node y={r.y}>
          <Txt x={-640} offsetX={-1} text={r.label} fontFamily={FONT} fontWeight={600} fontSize={25} fill={C.text2} />
          <Rect x={-300} offsetX={-1} width={760} height={56} radius={12} fill={alpha('#94a3b8', 0.07)} />
          <Rect x={-300} offsetX={-1} width={() => (r.v() / 51) * 760} height={56} radius={12} fill={r.color} shadowColor={r.color} shadowBlur={20} />
          <Txt x={() => -300 + (r.v() / 51) * 760 + 20} offsetX={-1} text={() => `${Math.round(r.v())}`} fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.text} />
        </Node>
      ))}
    </Panel>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield* pop(router(), 0.6, 0.7);
  yield* sequence(0.12, ...links.map((l) => l().end(1, 0.6, easeOutCubic)));

  for (const [i, phrase] of ['One for English', 'a faster multilingual', 'one fine-tuned'].entries()) {
    yield* at(cue(B.b2, phrase, -0.2));
    yield rise(ckRefs[i](), 0.6, 20);
  }

  // b3: route each input by what the text is written in
  yield* at(B.b3.start - 0.2);
  yield* sequence(0.12, ...inRefs.map((r) => rise(r(), 0.5, 16)));
  yield* at(cue(B.b3, 'detects', -0.2));
  for (const [i, inp] of inputs.entries()) {
    const target = inp.target;
    const color = cks[target].color;
    const d = (<Circle size={18} fill={color} shadowColor={color} shadowBlur={18} position={[IX + 220, IY(i)]} />) as Circle;
    dots().add(d);
    yield (function* () {
      yield* travel(d, [[IX + 220, IY(i)], [RX - 100, RY]], 0.5);
      yield pulse(router(), 1.06, 0.3);
      yield inRefs[i]().stroke(alpha(color, 0.8), 0.3);
      yield* travel(d, [[RX + 120, RY], [RX + 260, RY], [RX + 260, CKY[target]], [CKX - 300, CKY[target]]], 0.7);
      yield pulse(ckRefs[target](), 1.03, 0.3);
      yield* d.opacity(0, 0.2);
    })();
    yield* waitFor(0.75);
  }
  yield S.note('measured', 'MASSIVE intent, 51-language sweep (Laya README)');
  yield* at(cue(B.b3, 'Across fifty', -0.3));
  yield* all(diagram().opacity(0.08, 0.5), rise(stat(), 0.6, 20));
  yield* en(23, 0.9, easeOutCubic);
  yield* at(cue(B.b3, 'from twenty', -0.2));
  yield* routed(45, 1.2, easeOutCubic);

  yield* S.finish();
});
