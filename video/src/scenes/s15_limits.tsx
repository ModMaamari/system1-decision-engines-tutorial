import {Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createRef, easeInOutCubic, easeOutCubic, sequence} from '@motion-canvas/core';
import {setupStage} from '../lib/stage';
import {sceneHeader} from '../lib/layout';
import {at, cue, timing} from '../lib/timing';
import {C, FONT, MONO, alpha} from '../lib/theme';
import {Icon, ICONS, Panel, pop, rise} from '../lib/ui';

export default makeScene2D(function* (view) {
  const T = timing('s15_limits');
  const B = T.beats;
  const S = setupStage(view, T);
  yield S.run();

  const header = sceneHeader('Evaluate and review', 'The limits, stated plainly', C.score);
  S.content.add(header.node);

  const limits: {icon: keyof typeof ICONS; title: string; fact: string; cue: string}[] = [
    {icon: 'brain', title: 'Not a reasoner', fact: 'no explanations, no open questions', cue: 'not a reasoner'},
    {icon: 'target', title: 'Near chance zero-shot', fact: '0.36 vs 0.32 random on typed-decisions', cue: 'Zero-shot'},
    {icon: 'gauge', title: 'Ships over-confident', fact: 'ECE 0.466 before refitting', cue: 'they ship'},
    {icon: 'layers', title: 'Long option lists', fact: 'Banking77, 77 labels: 0.425', cue: 'long option'},
    {icon: 'globe', title: 'Other languages', fact: 'English checkpoint on Khmer: 0.000', cue: 'other languages'},
    {icon: 'alert', title: 'score is the weakest', fact: 'SST-5, five levels: 0.372', cue: 'other languages'},
  ];
  const intro = createRef<Node>();
  S.content.add(
    <Node ref={intro} y={40} opacity={0}>
      <Txt y={-40} text="It isn't magic." fontFamily={FONT} fontWeight={850} fontSize={100} letterSpacing={-2.5} fill={C.text} />
      <Txt y={60} text="Every limit that follows comes from Laya's own documentation." fontFamily={FONT} fontSize={32} fill={C.text2} />
    </Node>,
  );
  const cards = limits.map(() => createRef<Rect>());
  const grid = createRef<Node>();
  S.content.add(
    <Node ref={grid} y={50}>
      {limits.map((l, i) => (
        <Panel
          ref={cards[i]}
          x={((i % 3) - 1) * 570}
          y={(Math.floor(i / 3) - 0.5) * 250}
          width={530}
          height={220}
          opacity={0}
          layout
          direction="column"
          padding={34}
          gap={12}
        >
          <Rect layout direction="row" gap={16} alignItems="center">
            <Rect width={52} height={52} radius={14} fill={alpha(C.score, 0.14)} layout alignItems="center" justifyContent="center">
              <Icon name={l.icon} size={28} color={C.score} />
            </Rect>
            <Txt text={l.title} fontFamily={FONT} fontWeight={800} fontSize={32} fill={C.text} />
          </Rect>
          <Txt text={l.fact} fontFamily={FONT} fontSize={25} fill={C.text2} textWrap width={460} />
        </Panel>
      ))}
    </Node>,
  );

  const checklist = [
    'Evaluate on your own traffic',
    'Fine-tune on your own decisions',
    'Fit temperatures on held-out data',
    'Gate every change in CI',
  ];
  const checks = checklist.map(() => createRef<Rect>());
  const list = createRef<Node>();
  const cmd = createRef<Rect>();
  S.content.add(
    <Node ref={list} y={30}>
      {checklist.map((c, i) => (
        <Rect ref={checks[i]} x={-430} y={-200 + i * 110} offsetX={-1} layout direction="row" gap={24} alignItems="center" opacity={0}>
          <Rect width={60} height={60} radius={30} fill={alpha(C.s1, 0.16)} stroke={alpha(C.s1, 0.6)} lineWidth={2} layout alignItems="center" justifyContent="center">
            <Icon name="check" size={30} color={C.s1} stroke={3} />
          </Rect>
          <Txt text={c} fontFamily={FONT} fontWeight={750} fontSize={46} fill={C.text} />
        </Rect>
      ))}
      <Rect ref={cmd} y={270} layout padding={[14, 26]} radius={14} fill={alpha('#0b1220', 0.9)} stroke={alpha(C.s1, 0.4)} lineWidth={1.5} opacity={0}>
        <Txt text="laya-evals run data.jsonl --min-accuracy 0.8 --max-ece 0.05" fontFamily={MONO} fontSize={26} fill={C.text2} />
      </Rect>
    </Node>,
  );

  // ================================================================ timeline
  yield header.in();
  yield* at(B.b1.start - 0.1);
  yield* rise(intro(), 0.7, 30);
  yield* at(B.b2.start - 0.4);
  yield* all(intro().opacity(0, 0.35), intro().scale(0.96, 0.35));
  yield S.note('measured', 'Figures from Laya README and BENCHMARKS.md');
  for (let i = 0; i < limits.length; i++) {
    const t = i === 5 ? cue(B.b2, limits[i].cue, 0.5) : cue(B.b2, limits[i].cue, -0.25);
    yield* at(t);
    yield rise(cards[i](), 0.55, 24);
  }

  yield* at(B.b3.start - 0.35);
  yield* all(grid().opacity(0, 0.4), grid().scale(0.96, 0.4), S.hideNote());
  for (const [i, phrase] of ['evaluate on', 'fine-tune on', 'fit temperatures', 'gate every'].entries()) {
    yield* at(cue(B.b3, phrase, -0.2));
    yield rise(checks[i](), 0.5, 20);
  }
  yield* rise(cmd(), 0.5, 16);

  yield* S.finish();
});
