import {Circle, Layout, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Panel, Tag, draw, pop, pulse, rise} from '../lib/ui';

const CW = 540; // card width
const CH = 580; // card height
const L = -CW / 2 + 40; // left edge of card content

export default makeScene2D(function* (view) {
  const T = timing('s05_primitives');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('The decision primitives', 'Three question types');
  S.content.add(header.node);

  const cards = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const bodies = [createRef<Node>(), createRef<Node>(), createRef<Node>()];
  const cardX = [-580, 0, 580];
  const cardY = 60;
  const spec = [
    {type: 'CHOICE', color: C.choice, q: 'Which department should handle this?', out: 'pick one label'},
    {type: 'SCORE', color: C.score, q: 'How urgent is this?', out: 'an ordered level'},
    {type: 'NOUL', color: C.noul, q: 'Does the user threaten to cancel?', out: 'P(true)'},
  ];
  for (let i = 0; i < 3; i++) {
    S.content.add(
      <Node ref={cards[i]} x={cardX[i]} y={cardY} opacity={0}>
        <Panel width={CW} height={CH} accent={spec[i].color} />
        <Tag x={L} y={-CH / 2 + 48} offsetX={-1} text={spec[i].type} color={spec[i].color} size={18} />
        <Txt x={CW / 2 - 40} y={-CH / 2 + 48} offsetX={1} text={spec[i].out} fontFamily={FONT} fontSize={20} fill={C.text3} />
        <Txt
          x={L}
          y={-CH / 2 + 125}
          offsetX={-1}
          text={spec[i].q}
          fontFamily={FONT}
          fontWeight={750}
          fontSize={31}
          lineHeight={40}
          fill={C.text}
          textWrap
          width={CW - 80}
        />
        <Node ref={bodies[i]} opacity={0} />
      </Node>,
    );
  }

  // --- choice ---------------------------------------------------------------------------------
  const choiceOpts = [
    {label: 'billing', desc: 'invoices, payments, refunds', p: 0.91},
    {label: 'technical', desc: 'bugs, outages, system errors', p: 0.06},
    {label: 'other', desc: 'everything else', p: 0.03},
  ];
  const cv = choiceOpts.map(() => createSignal(0));
  const descRefs = choiceOpts.map(() => createRef<Txt>());
  const choiceOut = createRef<Rect>();
  bodies[0]().add(
    <Node>
      {choiceOpts.map((o, i) => {
        const y = -78 + i * 94;
        return (
          <Node y={y}>
            <Txt x={L} offsetX={-1} text={o.label} fontFamily={MONO} fontWeight={700} fontSize={27} fill={C.choice} />
            <Txt x={CW / 2 - 40} offsetX={1} text={() => cv[i]().toFixed(2)} fontFamily={MONO} fontWeight={600} fontSize={24} fill={C.text2} />
            <Txt ref={descRefs[i]} x={L} y={30} offsetX={-1} text={o.desc} fontFamily={FONT} fontSize={21} fill={C.text3} />
            <Rect x={L} y={58} offsetX={-1} width={CW - 80} height={10} radius={5} fill={alpha('#94a3b8', 0.1)} />
            <Rect
              x={L}
              y={58}
              offsetX={-1}
              width={() => (CW - 80) * cv[i]()}
              height={10}
              radius={5}
              fill={i === 0 ? C.choice : alpha(C.choice, 0.5)}
              shadowColor={C.choice}
              shadowBlur={i === 0 ? 14 : 0}
            />
          </Node>
        );
      })}
      <Rect ref={choiceOut} y={232} layout padding={[12, 24]} radius={14} fill={alpha(C.choice, 0.14)} stroke={alpha(C.choice, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="choice: billing" fontFamily={MONO} fontWeight={700} fontSize={28} fill={C.choice} />
      </Rect>
    </Node>,
  );

  // --- score ----------------------------------------------------------------------------------
  const levels = [
    {label: 'not urgent', p: 0.04},
    {label: 'soon', p: 0.08},
    {label: 'blocking', p: 0.88},
  ];
  const sv = levels.map(() => createSignal(0));
  const base = 80;
  const colX = [-150, 0, 150];
  const expected = createSignal(0);
  const marker = createRef<Node>();
  const scoreFormula = createRef<Rect>();
  bodies[1]().add(
    <Node>
      {levels.map((lv, i) => (
        <Node>
          <Rect x={colX[i]} y={base} offsetY={1} width={92} height={180} radius={10} fill={alpha('#94a3b8', 0.06)} />
          <Rect
            x={colX[i]}
            y={base}
            offsetY={1}
            width={92}
            height={() => Math.max(4, 180 * sv[i]())}
            radius={10}
            fill={i === 2 ? C.score : alpha(C.score, 0.55)}
            shadowColor={C.score}
            shadowBlur={i === 2 ? 16 : 0}
          />
          <Txt x={colX[i]} y={base - 202} text={() => sv[i]().toFixed(2)} fontFamily={MONO} fontWeight={600} fontSize={22} fill={C.text2} />
          <Txt x={colX[i]} y={base + 28} text={`${i}`} fontFamily={MONO} fontWeight={700} fontSize={26} fill={C.score} />
          <Txt x={colX[i]} y={base + 56} text={lv.label} fontFamily={FONT} fontSize={20} fill={C.text3} />
        </Node>
      ))}
      <Line points={[[-150, 182], [150, 182]]} stroke={alpha(C.score, 0.35)} lineWidth={3} />
      <Node ref={marker} x={() => -150 + (expected() / 2) * 300} y={182} opacity={0}>
        <Circle size={22} fill={C.score} shadowColor={C.score} shadowBlur={18} />
      </Node>
      <Rect ref={scoreFormula} y={240} layout padding={[12, 22]} radius={14} fill={alpha(C.score, 0.14)} stroke={alpha(C.score, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="score = Σ i · pᵢ = 1.84" fontFamily={MONO} fontWeight={700} fontSize={26} fill={C.score} />
      </Rect>
    </Node>,
  );

  // --- noul -----------------------------------------------------------------------------------
  const pv = createSignal(0);
  const R = 150;
  const noulOut = createRef<Rect>();
  bodies[2]().add(
    <Node y={70}>
      <Circle size={R * 2} startAngle={180} endAngle={360} stroke={alpha('#94a3b8', 0.12)} lineWidth={26} lineCap="round" />
      <Circle
        size={R * 2}
        startAngle={180}
        endAngle={() => 180 + 180 * Math.max(0.001, pv())}
        stroke={C.noul}
        lineWidth={26}
        lineCap="round"
        shadowColor={C.noul}
        shadowBlur={20}
      />
      <Txt y={-40} text={() => pv().toFixed(2)} fontFamily={MONO} fontWeight={800} fontSize={60} fill={C.text} />
      <Txt y={8} text="P(true)" fontFamily={MONO} fontSize={22} fill={C.noul} />
      <Txt x={-R} y={40} text="false" fontFamily={MONO} fontSize={20} fill={C.text3} />
      <Txt x={R} y={40} text="true" fontFamily={MONO} fontSize={20} fill={C.text3} />
      <Rect ref={noulOut} y={150} layout padding={[12, 24]} radius={14} fill={alpha(C.noul, 0.14)} stroke={alpha(C.noul, 0.5)} lineWidth={1.5} opacity={0}>
        <Txt text="noul: 0.93" fontFamily={MONO} fontWeight={700} fontSize={28} fill={C.noul} />
      </Rect>
    </Node>,
  );

  // --- one batched call -----------------------------------------------------------------------
  const batch = createRef<Node>();
  const brace = createRef<Line>();
  S.content.add(
    <Node ref={batch} y={cardY + CH / 2 + 50} opacity={0}>
      <Line ref={brace} points={[[-850, -26], [-850, 0], [850, 0], [850, -26]]} stroke={alpha(C.s1, 0.6)} lineWidth={3} radius={10} />
      <Rect y={0} layout direction="row" gap={18} alignItems="center" padding={[12, 26]} radius={999} fill={C.bg} stroke={alpha(C.s1, 0.6)} lineWidth={2}>
        <Txt text="one input · three rows · one batched forward call" fontFamily={FONT} fontWeight={700} fontSize={26} fill={C.s1} />
        <Txt text="output tokens: 0" fontFamily={MONO} fontSize={22} fill={C.text3} />
      </Rect>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield* sequence(0.18, ...cards.map((c) => rise(c(), 0.7, 40)));

  const focus = function* (i: number) {
    yield* all(
      ...cards.map((c, j) => c().opacity(j === i ? 1 : 0.32, 0.5)),
      ...cards.map((c, j) => c().scale(j === i ? 1.04 : 0.97, 0.6, easeInOutCubic)),
    );
  };

  // b2: choice
  yield* at(B.b2.start - 0.2);
  yield focus(0);
  yield bodies[0]().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* all(...cv.map((v, i) => v(choiceOpts[i].p, 1.1, easeOutCubic)));
  yield* pop(choiceOut(), 0.5, 0.8);
  yield* at(cue(B.b2, 'The label descriptions', -0.1));
  yield* sequence(0.15, ...descRefs.map((d) => all(d().fill(C.text, 0.4), pulse(d(), 1.06, 0.5))));

  // b3: score
  yield* at(B.b3.start - 0.2);
  yield focus(1);
  yield bodies[1]().opacity(1, 0.5);
  yield* waitFor(0.3);
  yield* all(...sv.map((v, i) => v(levels[i].p, 1.1, easeOutCubic)));
  yield* at(cue(B.b3, 'expected level', -0.2));
  yield marker().opacity(1, 0.3);
  yield* expected(1.84, 1.3, easeInOutCubic);
  yield* pop(scoreFormula(), 0.5, 0.8);

  // b4: noul
  yield* at(B.b4.start - 0.2);
  yield focus(2);
  yield bodies[2]().opacity(1, 0.5);
  yield* waitFor(0.3);
  yield* pv(0.93, 1.4, easeOutCubic);
  yield* pop(noulOut(), 0.5, 0.8);
  yield S.note('illustrative', 'Probabilities shown are an example');

  // b5: one batched call
  yield* at(B.b5.start - 0.2);
  yield* all(...cards.map((c) => all(c().opacity(1, 0.5), c().scale(0.96, 0.6, easeInOutCubic))));
  yield batch().opacity(1, 0.4);
  yield* draw(brace(), 0.8);

  yield* S.finish();
});
