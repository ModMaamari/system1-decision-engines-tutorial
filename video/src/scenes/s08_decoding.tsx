import {Circle, Latex, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, createSignal, easeInOutCubic, easeOutCubic, sequence, waitFor} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, Panel, pop, rise} from '../lib/ui';

const LOGITS = [2.2, 0.9, 0.1, -0.4];
const NAMES = ['billing', 'technical', 'sales', 'other'];

function softmax(z: number[], t: number) {
  const e = z.map((v) => Math.exp(v / t));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export default makeScene2D(function* (view) {
  const T = timing('s08_decoding');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Inside the engine', 'From logits to answers');
  S.content.add(header.node);

  const temp = createSignal(1);
  const probs = () => softmax(LOGITS, temp());

  const formula = createRef<Latex>();
  S.content.add(
    <Latex ref={formula} x={420} y={-330} height={120} fill={C.text} opacity={0} tex={'p_i=\\frac{e^{z_i/T}}{\\sum_{j} e^{z_j/T}}'} />,
  );

  // logits (left) and probabilities (right)
  const main = createRef<Node>();
  const barW = 620;
  const rowY = (i: number) => -110 + i * 78;
  S.content.add(
    <Node ref={main} opacity={0}>
      <Txt x={-760} y={-180} offsetX={-1} text="LOGITS z" fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={4} fill={C.text3} />
      <Txt x={-120} y={-180} offsetX={-1} text="PROBABILITIES p" fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={4} fill={C.text3} />
      {LOGITS.map((z, i) => (
        <Node y={rowY(i)}>
          <Txt x={-760} offsetX={-1} text={NAMES[i]} fontFamily={MONO} fontWeight={600} fontSize={26} fill={C.choice} />
          <Txt x={-400} offsetX={1} text={z >= 0 ? `+${z.toFixed(1)}` : `−${Math.abs(z).toFixed(1)}`} fontFamily={MONO} fontWeight={700} fontSize={28} fill={C.text} />
          <Line points={[[-360, 0], [-180, 0]]} stroke={alpha(C.text3, 0.4)} lineWidth={2} endArrow arrowSize={9} lineDash={[6, 6]} />
          <Rect x={-120} offsetX={-1} width={barW} height={34} radius={17} fill={alpha('#94a3b8', 0.08)} />
          <Rect
            x={-120}
            offsetX={-1}
            width={() => Math.max(10, probs()[i] * barW)}
            height={34}
            radius={17}
            fill={i === 0 ? C.s1 : alpha(C.s1, 0.45)}
            shadowColor={C.s1}
            shadowBlur={i === 0 ? 18 : 0}
          />
          <Txt x={-120 + barW + 26} offsetX={-1} text={() => probs()[i].toFixed(2)} fontFamily={MONO} fontWeight={600} fontSize={26} fill={C.text2} />
        </Node>
      ))}
    </Node>,
  );
  const crown = createRef<Node>();
  S.content.add(
    <Node ref={crown} x={-120 + barW + 150} y={rowY(0)} opacity={0}>
      <Rect layout padding={[6, 14]} radius={999} fill={alpha(C.s1, 0.16)} stroke={alpha(C.s1, 0.6)} lineWidth={1.5} alignItems="center" gap={8}>
        <Icon name="check" size={18} color={C.s1} stroke={3} />
        <Txt text="answer" fontFamily={FONT} fontWeight={700} fontSize={19} fill={C.s1} />
      </Rect>
    </Node>,
  );

  // temperature slider
  const slider = createRef<Node>();
  const sx = (t: number) => -120 + ((t - 0.5) / 2.5) * barW;
  S.content.add(
    <Node ref={slider} y={230} opacity={0}>
      <Txt x={-400} offsetX={1} text="temperature" fontFamily={FONT} fontWeight={650} fontSize={24} fill={C.text2} />
      <Rect x={-120} offsetX={-1} width={barW} height={6} radius={3} fill={alpha('#94a3b8', 0.2)} />
      <Line points={[[sx(1), -16], [sx(1), 16]]} stroke={alpha(C.text3, 0.6)} lineWidth={2} />
      <Txt x={sx(1)} y={36} text="1" fontFamily={MONO} fontSize={18} fill={C.text3} />
      <Txt x={sx(0.5)} y={36} text="0.5" fontFamily={MONO} fontSize={18} fill={C.text3} />
      <Txt x={sx(3)} y={36} text="3" fontFamily={MONO} fontSize={18} fill={C.text3} />
      <Circle x={() => sx(temp())} size={30} fill={C.score} shadowColor={C.score} shadowBlur={20} />
      <Txt x={() => sx(temp())} y={-36} text={() => `T = ${temp().toFixed(2)}`} fontFamily={MONO} fontWeight={700} fontSize={22} fill={C.score} />
      <Txt x={-120 + barW + 26} offsetX={-1} text={() => (temp() > 1.05 ? 'spread out' : temp() < 0.95 ? 'sharpened' : '')} fontFamily={FONT} fontWeight={650} fontSize={22} fill={C.score} />
    </Node>,
  );
  const same = createRef<Rect>();
  S.content.add(
    <Rect ref={same} x={190} y={320} layout padding={[10, 18]} radius={12} fill={alpha(C.s1, 0.1)} stroke={alpha(C.s1, 0.4)} lineWidth={1.5} opacity={0} alignItems="center" gap={10}>
      <Txt text="answer never changes" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.s1} />
    </Rect>,
  );

  // two confidences
  const conf = createRef<Node>();
  const c1 = createRef<Rect>();
  const c2 = createRef<Rect>();
  S.content.add(
    <Node ref={conf} y={80}>
      <Panel ref={c1} x={-440} width={760} height={330} opacity={0} layout direction="column" padding={44} gap={18}>
        <Txt text="confidence" fontFamily={MONO} fontWeight={700} fontSize={34} fill={C.text2} />
        <Latex tex={'1-\\frac{H(p)}{\\log k}'} height={86} fill={C.text2} />
        <Txt text="How peaked the whole distribution is. Descriptive only." fontFamily={FONT} fontSize={25} fill={C.text3} textWrap width={660} />
      </Panel>
      <Panel ref={c2} x={440} width={760} height={330} accent={C.s1} opacity={0} layout direction="column" padding={44} gap={18}>
        <Txt text="answer_confidence" fontFamily={MONO} fontWeight={700} fontSize={34} fill={C.s1Strong} />
        <Latex tex={'\\max_i\\, p_i'} height={60} fill={C.text} />
        <Txt text="The probability of the chosen answer. Calibrated. Gate on this." fontFamily={FONT} fontSize={25} fill={C.text2} textWrap width={660} />
      </Panel>
    </Node>,
  );
  const gateCode = createRef<Rect>();
  S.content.add(
    <Rect ref={gateCode} x={440} y={320} layout padding={[12, 22]} radius={12} fill={alpha('#0b1220', 0.9)} stroke={alpha(C.s1, 0.4)} lineWidth={1.5} opacity={0}>
      <Txt text="agent.predict(state, questions, min_confidence=0.85)" fontFamily={MONO} fontSize={22} fill={C.text2} />
    </Rect>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start);
  yield main().opacity(1, 0.6);
  yield* at(cue(B.b1, 'divide', -0.2));
  yield* all(formula().opacity(1, 0.6), formula().y(-300, 0.6, easeOutCubic));
  yield* at(cue(B.b1, 'softmax', -0.2));
  yield* all(slider().opacity(1, 0.5), crown().opacity(1, 0.5));

  // b2: temperature changes confidence, not the answer
  yield* at(B.b2.start);
  yield* temp(2.6, 1.6, easeInOutCubic);
  yield* pop(same(), 0.5, 0.8);
  yield* temp(0.55, 1.8, easeInOutCubic);
  yield* temp(1, 1.2, easeInOutCubic);

  // b3: gate on answer_confidence
  yield* at(B.b3.start - 0.2);
  yield* all(main().opacity(0, 0.4), slider().opacity(0, 0.4), crown().opacity(0, 0.4), same().opacity(0, 0.4), formula().opacity(0, 0.4));
  yield* at(cue(B.b3, 'two confidence', -0.2));
  yield* sequence(0.25, rise(c1(), 0.6, 30), rise(c2(), 0.6, 30));
  yield* at(cue(B.b3, 'gate on', -0.1));
  yield* all(c1().opacity(0.45, 0.5), c2().scale(1.04, 0.5, easeOutCubic), c2().shadowColor(alpha(C.s1, 0.5), 0.5));
  yield* at(cue(B.b3, 'calibration is fitted', -0.2));
  yield* rise(gateCode(), 0.5, 16);

  yield* S.finish();
});
