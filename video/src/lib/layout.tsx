import {Node, Txt} from '@motion-canvas/2d';
import {all, createRef, easeOutCubic, type ThreadGenerator} from '@motion-canvas/core';
import {C, FONT} from './theme';

/** The standard scene header: a small eyebrow and a heading, top left. */
export function sceneHeader(eyebrow: string, title: string, color: string = C.s1) {
  const node = createRef<Node>();
  const eb = createRef<Txt>();
  const hd = createRef<Txt>();
  const el = (
    <Node ref={node}>
      <Txt
        ref={eb}
        x={-840}
        y={-392}
        offsetX={-1}
        text={eyebrow.toUpperCase()}
        fontFamily={FONT}
        fontWeight={700}
        fontSize={18}
        letterSpacing={4}
        fill={color}
        opacity={0}
      />
      <Txt
        ref={hd}
        x={-840}
        y={-340}
        offsetX={-1}
        text={title}
        fontFamily={FONT}
        fontWeight={800}
        fontSize={60}
        letterSpacing={-1.2}
        fill={C.text}
        opacity={0}
      />
    </Node>
  );
  return {
    node: el as Node,
    heading: hd,
    *in(): ThreadGenerator {
      eb().x(-860);
      hd().x(-870);
      yield* all(
        eb().opacity(1, 0.6, easeOutCubic),
        eb().x(-840, 0.7, easeOutCubic),
        hd().opacity(1, 0.7, easeOutCubic),
        hd().x(-840, 0.8, easeOutCubic),
      );
    },
  };
}
