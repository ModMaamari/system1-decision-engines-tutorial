import {Circle, Line, Node, Rect, Txt, makeScene2D, Gradient} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, linear, sequence, useRandom, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Panel, Tag, draw, pop, pulse, rise} from '../lib/ui';

const KIND_COLOR: Record<string, string> = {
  g: '#94a3b8', // special tokens
  h: '#cbd5e1', // header
  M: C.s1, // markers
  o: C.choice, // option text
  x: C.score, // state
};

export default makeScene2D(function* (view) {
  const T = timing('s07_forward');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Inside the engine', 'The forward pass');
  S.content.add(header.node);

  const Y = 30;
  const kinds = 'ghhgMoMoMogxx'.split('');
  const n = kinds.length;
  const colY = (i: number) => Y + (i - (n - 1) / 2) * 33;
  const random = useRandom(5);

  const pipe = createRef<Node>();
  S.content.add(<Node ref={pipe} />);

  // tokens
  const toks = kinds.map(() => createRef<Rect>());
  pipe().add(
    <Node>
      {kinds.map((k, i) => (
        <Rect ref={toks[i]} x={-820} y={colY(i)} width={26} height={26} radius={6} fill={alpha(KIND_COLOR[k], k === 'M' ? 0.9 : 0.55)} opacity={0} />
      ))}
    </Node>,
  );
  const tokLabel = createRef<Txt>();
  pipe().add(<Txt ref={tokLabel} x={-820} y={colY(n - 1) + 52} text="one row" fontFamily={FONT} fontSize={20} fill={C.text3} opacity={0} />);

  // encoder
  const enc = createRef<Rect>();
  const encScan = createSignal(-1);
  const encLabel = createRef<Txt>();
  pipe().add(
    <Node>
      <Rect
        ref={enc}
        x={-590}
        y={Y}
        width={200}
        height={470}
        radius={22}
        fill={new Gradient({fromY: -235, toY: 235, stops: [{offset: 0, color: alpha(C.s1Deep, 0.35)}, {offset: 1, color: alpha('#1d4ed8', 0.25)}]})}
        stroke={alpha(C.s1, 0.55)}
        lineWidth={2}
        opacity={0}
        clip
      >
        {Array.from({length: 7}, (_, i) => (
          <Rect y={-195 + i * 65} width={160} height={46} radius={10} fill={alpha('#e2e8f0', 0.06)} stroke={alpha('#e2e8f0', 0.12)} lineWidth={1} />
        ))}
        <Rect y={() => encScan() * 260} width={200} height={70} fill={new Gradient({fromY: -35, toY: 35, stops: [{offset: 0, color: alpha(C.s1, 0)}, {offset: 0.5, color: alpha(C.s1, 0.45)}, {offset: 1, color: alpha(C.s1, 0)}]})} />
        <Txt text="Encoder" fontFamily={FONT} fontWeight={800} fontSize={30} fill={C.text} rotation={-90} />
      </Rect>
      <Txt ref={encLabel} x={-590} y={Y + 270} text="ModernBERT-large · 421M" fontFamily={FONT} fontWeight={650} fontSize={21} fill={C.s1} opacity={0} />
    </Node>,
  );

  // hidden states after the encoder
  const hid = kinds.map(() => createRef<Rect>());
  pipe().add(
    <Node>
      {kinds.map((_, i) => (
        <Rect ref={hid[i]} x={-380} y={colY(i)} width={26} height={26} radius={6} fill={alpha(C.s1, 0.25 + random.nextFloat(0, 0.5))} opacity={0} />
      ))}
    </Node>,
  );

  // type embedding
  const plus = createRef<Node>();
  pipe().add(
    <Node ref={plus} x={-275} y={Y} opacity={0}>
      <Circle size={56} fill={alpha(C.choice, 0.15)} stroke={C.choice} lineWidth={2} />
      <Txt text="+" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.choice} y={-2} />
      <Tag y={-78} text="type: choice" color={C.choice} size={17} />
      <Txt y={62} text="type embedding" fontFamily={FONT} fontSize={18} fill={C.text3} />
    </Node>,
  );

  // decision head
  const head = createRef<Rect>();
  pipe().add(
    <Rect
      ref={head}
      x={-130}
      y={Y}
      width={150}
      height={420}
      radius={22}
      fill={alpha(C.noul, 0.12)}
      stroke={alpha(C.noul, 0.55)}
      lineWidth={2}
      opacity={0}
    >
      <Rect y={-60} width={110} height={90} radius={12} fill={alpha(C.noul, 0.12)} stroke={alpha(C.noul, 0.3)} lineWidth={1} />
      <Rect y={60} width={110} height={90} radius={12} fill={alpha(C.noul, 0.12)} stroke={alpha(C.noul, 0.3)} lineWidth={1} />
      <Txt y={-230} text="Decision head" fontFamily={FONT} fontWeight={750} fontSize={22} fill={C.text} />
      <Txt y={235} text="2 layers" fontFamily={FONT} fontSize={19} fill={C.text3} />
    </Rect>,
  );

  // head outputs
  const out = kinds.map(() => createRef<Rect>());
  pipe().add(
    <Node>
      {kinds.map((k, i) => (
        <Rect ref={out[i]} x={40} y={colY(i)} width={26} height={26} radius={6} fill={k === 'M' ? C.s1 : alpha(C.noul, 0.3 + random.nextFloat(0, 0.35))} opacity={0} shadowColor={C.s1} shadowBlur={k === 'M' ? 12 : 0} />
      ))}
    </Node>,
  );
  const markerIdx = kinds.map((k, i) => (k === 'M' ? i : -1)).filter((i) => i >= 0);

  // gathered marker vectors, scorer, logits
  const vecY = (i: number, count: number) => Y + (i - (count - 1) / 2) * (count > 4 ? 52 : 92);
  const vectors = createRef<Node>();
  const scorer = createRef<Rect>();
  const logits = createRef<Node>();
  const gatherLabel = createRef<Txt>();
  pipe().add(
    <Node>
      <Txt ref={gatherLabel} x={235} y={Y - 205} text="gather at markers" fontFamily={FONT} fontWeight={650} fontSize={20} fill={C.s1} opacity={0} />
      <Node ref={vectors} />
      <Rect ref={scorer} x={455} y={Y} width={150} height={300} radius={22} fill={alpha(C.s1, 0.1)} stroke={alpha(C.s1, 0.6)} lineWidth={2} opacity={0}>
        <Txt y={-22} text="Scorer" fontFamily={FONT} fontWeight={800} fontSize={26} fill={C.text} />
        <Txt y={12} text="shared MLP" fontFamily={FONT} fontSize={19} fill={C.text3} />
      </Rect>
      <Node ref={logits} />
    </Node>,
  );

  const makeVector = (y: number, h = 40, w = 150) => {
    const cells = 7;
    return (
      <Node x={235} y={y}>
        <Rect width={w} height={h} radius={8} fill={alpha(C.s1, 0.08)} stroke={alpha(C.s1, 0.7)} lineWidth={1.5} shadowColor={C.s1} shadowBlur={14} />
        {Array.from({length: cells}, (_, c) => (
          <Rect x={-w / 2 + 8 + (c + 0.5) * ((w - 16) / cells)} width={(w - 16) / cells - 4} height={h - 14} radius={3} fill={alpha(C.s1, 0.2 + random.nextFloat(0, 0.7))} />
        ))}
      </Node>
    ) as Node;
  };
  const optionNames = ['billing', 'technical', 'other', 'sales', 'refund', 'account', 'shipping', 'fraud'];
  const logitValues = [3.1, 0.4, -0.6, 1.2, -1.4, 0.2, -0.3, 0.9];
  const makeLogit = (i: number, y: number, size = 30) =>
    (
      <Node x={640} y={y}>
        <Txt offsetX={1} x={40} text={logitValues[i] >= 0 ? `+${logitValues[i].toFixed(1)}` : `−${Math.abs(logitValues[i]).toFixed(1)}`} fontFamily={MONO} fontWeight={700} fontSize={size} fill={i === 0 ? C.s1Strong : C.text} />
        <Txt x={62} offsetX={-1} text={optionNames[i]} fontFamily={MONO} fontSize={size * 0.8} fill={C.choice} />
      </Node>
    ) as Node;

  const sameWeights = createRef<Rect>();
  pipe().add(
    <Rect ref={sameWeights} x={455} y={Y + 245} layout padding={[10, 20]} radius={999} fill={alpha(C.s1, 0.12)} stroke={alpha(C.s1, 0.6)} lineWidth={1.5} opacity={0}>
      <Txt text="same weights · any number of options" fontFamily={FONT} fontWeight={700} fontSize={21} fill={C.s1Strong} />
    </Rect>,
  );

  // latency
  const stats = [
    {v: 32.8, unit: 'ms', label: '1 question', sub: 'one forward call'},
    {v: 72.3, unit: 'ms', label: '10 questions', sub: 'still one batched call'},
    {v: 7.2, unit: 'ms', label: 'per question', sub: 'at 10 per call', approx: true},
  ];
  const statRefs = stats.map(() => createRef<Rect>());
  const statVals = stats.map(() => createSignal(0));
  const latency = createRef<Node>();
  S.content.add(
    <Node ref={latency} y={70}>
      {stats.map((s, i) => (
        <Panel ref={statRefs[i]} x={(i - 1) * 540} width={480} height={300} accent={i === 2 ? C.s1 : undefined} opacity={0}>
          <Txt y={-50} text={() => `${s.approx ? '≈' : ''}${statVals[i]().toFixed(1)}`} fontFamily={FONT} fontWeight={850} fontSize={104} letterSpacing={-3} fill={i === 2 ? C.s1Strong : C.text} />
          <Txt y={32} text={s.unit} fontFamily={MONO} fontWeight={600} fontSize={28} fill={C.text3} />
          <Txt y={84} text={s.label} fontFamily={FONT} fontWeight={750} fontSize={32} fill={C.text} />
          <Txt y={124} text={s.sub} fontFamily={FONT} fontSize={22} fill={C.text3} />
        </Panel>
      ))}
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield* sequence(0.04, ...toks.map((t) => pop(t(), 0.35, 0.5)));
  yield tokLabel().opacity(1, 0.4);
  yield enc().opacity(1, 0.6);

  // b2: encoder, type embedding, decision head
  yield* at(cue(B.b2, 'A pretrained', -0.1));
  yield tokLabel().opacity(0, 0.3);
  yield* sequence(0.03, ...toks.map((t) => all(t().x(-590, 0.55, easeInOutCubic), t().opacity(0, 0.55))));
  yield encScan(1, 1.1, linear).to(-1, 0).to(1, 1.1, linear);
  yield* at(cue(B.b2, 'ModernBERT', -0.1));
  yield encLabel().opacity(1, 0.5);
  yield* sequence(0.03, ...hid.map((h) => pop(h(), 0.35, 0.5)));
  yield* at(cue(B.b2, 'type embedding', -0.1));
  yield* pop(plus(), 0.5, 0.6);
  yield* all(...hid.map((h) => h().fill(alpha(C.choice, 0.35 + random.nextFloat(0, 0.45)), 0.5)));
  yield* at(cue(B.b2, 'decision head', -0.2));
  yield* rise(head(), 0.5, 20);
  yield* sequence(0.03, ...hid.map((h, i) => all(h().x(-130, 0.45, easeInOutCubic), h().opacity(0, 0.45))));
  yield head().stroke(C.noul, 0.3).to(alpha(C.noul, 0.55), 0.6);
  yield* sequence(0.03, ...out.map((o) => pop(o(), 0.35, 0.5)));
  yield* all(...out.map((o, i) => (kinds[i] === 'M' ? pulse(o(), 1.3, 0.5) : o().opacity(0.35, 0.5))));

  // b3: gather at markers, score each
  yield* at(cue(B.b3, 'gathers', -0.2));
  yield gatherLabel().opacity(1, 0.4);
  let vecNodes = markerIdx.map((_, j) => makeVector(vecY(j, 3)));
  for (const [j, v] of vecNodes.entries()) {
    const src = out[markerIdx[j]]();
    v.position([src.x(), src.y()]);
    v.scale(0.2);
    v.opacity(0);
    vectors().add(v);
  }
  yield* sequence(
    0.12,
    ...vecNodes.map((v, j) => all(v.opacity(1, 0.3), v.position([235, vecY(j, 3)], 0.7, easeInOutCubic), v.scale(1, 0.7, easeInOutCubic))),
  );
  yield* at(cue(B.b3, 'shared scorer', -0.2));
  yield* rise(scorer(), 0.5, 20);
  let logitNodes = markerIdx.map((_, j) => makeLogit(j, vecY(j, 3)));
  for (const l of logitNodes) {
    l.opacity(0);
    logits().add(l);
  }
  yield* sequence(
    0.18,
    ...vecNodes.map((v, j) =>
      all(
        (function* () {
          const ghost = makeVector(v.y());
          ghost.opacity(0.9);
          vectors().add(ghost);
          yield* all(ghost.x(455, 0.5, easeInOutCubic), ghost.scale(0.3, 0.5), ghost.opacity(0, 0.5));
          ghost.remove();
        })(),
        (function* () {
          yield* waitFor(0.4);
          yield* pop(logitNodes[j], 0.45, 0.6);
        })(),
      ),
    ),
  );

  // b4: any number of options
  yield* at(B.b4.start + 0.3);
  yield* pop(sameWeights(), 0.5, 0.8);
  for (const count of [2, 8, 3]) {
    yield* all(...vecNodes.map((v) => v.opacity(0, 0.3)), ...logitNodes.map((l) => l.opacity(0, 0.3)));
    vectors().removeChildren();
    logits().removeChildren();
    const size = count > 4 ? 0.62 : 1;
    vecNodes = Array.from({length: count}, (_, j) => {
      const v = makeVector(vecY(j, count), 40 * size, 150);
      v.opacity(0);
      vectors().add(v);
      return v;
    });
    logitNodes = Array.from({length: count}, (_, j) => {
      const l = makeLogit(j, vecY(j, count), count > 4 ? 22 : 30);
      l.opacity(0);
      logits().add(l);
      return l;
    });
    yield* sequence(0.05, ...vecNodes.map((v) => v.opacity(1, 0.3)));
    yield* pulse(scorer(), 1.05, 0.4);
    yield* sequence(0.05, ...logitNodes.map((l) => l.opacity(1, 0.3)));
    yield* waitFor(count === 3 ? 0 : 1.0);
  }

  // b5: latency on a T4
  yield* at(B.b5.start - 0.3);
  yield* all(pipe().opacity(0, 0.5), pipe().y(-40, 0.5));
  yield S.note('measured', 'Tesla T4, laya-multilingual (Laya README)');
  for (const [i, phrase] of ['one question', 'Ten questions', 'about seven'].entries()) {
    yield* at(cue(B.b5, phrase, -0.25));
    yield rise(statRefs[i](), 0.6, 30);
    yield statVals[i](stats[i].v, 0.9, easeOutCubic);
  }

  yield* S.finish();
});
