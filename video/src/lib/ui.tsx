import {
  Layout,
  Line,
  Node,
  Path,
  Rect,
  Txt,
  type NodeProps,
  type RectProps,
  type TxtProps,
} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInCubic,
  easeOutBack,
  easeOutCubic,
  type Reference,
  type SignalValue,
  type SimpleSignal,
  type ThreadGenerator,
  tween,
} from '@motion-canvas/core';
import {C, FONT, MONO, alpha} from './theme';

// -----------------------------------------------------------------------------------------
// Text

export function Heading(props: TxtProps) {
  return <Txt fontFamily={FONT} fontWeight={800} fontSize={76} letterSpacing={-1.5} fill={C.text} {...props} />;
}

export function Body(props: TxtProps) {
  return <Txt fontFamily={FONT} fontWeight={450} fontSize={30} lineHeight={44} fill={C.text2} {...props} />;
}

export function Mono(props: TxtProps) {
  return <Txt fontFamily={MONO} fontWeight={500} fontSize={24} fill={C.text} {...props} />;
}

export function Eyebrow(props: TxtProps & {color?: string}) {
  const {color = C.s1, ...rest} = props;
  return <Txt fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={4} fill={color} {...rest} />;
}

// -----------------------------------------------------------------------------------------
// Surfaces

export function Panel(props: RectProps & {accent?: string}) {
  const {accent, ...rest} = props;
  return (
    <Rect
      radius={24}
      fill={alpha(C.surface, 0.78)}
      stroke={accent ? alpha(accent, 0.45) : alpha('#94a3b8', 0.14)}
      lineWidth={1.5}
      shadowColor={'rgba(0,0,0,0.45)'}
      shadowBlur={48}
      shadowOffsetY={14}
      {...rest}
    />
  );
}

export function Tag(props: RectProps & {text: SignalValue<string>; color?: string; size?: number}) {
  const {text, color = C.s1, size = 20, ...rest} = props;
  return (
    <Rect
      layout
      alignItems="center"
      justifyContent="center"
      padding={[size * 0.35, size * 0.8]}
      radius={999}
      fill={alpha(color, 0.13)}
      stroke={alpha(color, 0.45)}
      lineWidth={1.5}
      {...rest}
    >
      <Txt text={text} fontFamily={FONT} fontWeight={650} fontSize={size} fill={color} />
    </Rect>
  );
}

// -----------------------------------------------------------------------------------------
// Icons: stroke paths from Lucide (ISC licence), drawn on a 24 x 24 grid.

export const ICONS = {
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  alert: 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  target: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M12 12m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  route: 'M6 19m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M18 5m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  refresh: 'M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M3 21v-5h5',
  brain: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18ZM12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18ZM12 5v13',
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  globe: 'M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  cpu: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3',
  sparkles: 'M9.94 14.06 8 20l-1.94-5.94L0 12l6.06-1.94L8 4l1.94 6.06L16 12zM19 3v4M17 5h4',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
} as const;

export function Icon(props: RectProps & {name: keyof typeof ICONS; size?: number; color?: SignalValue<string>; stroke?: number}) {
  const {name, size = 32, color = C.text, stroke = 2, ...rest} = props;
  return (
    <Rect width={size} height={size} {...rest}>
      <Path
        layout={false}
        data={ICONS[name]}
        scale={size / 24}
        position={[-size / 2, -size / 2]}
        stroke={color}
        lineWidth={stroke}
        lineCap="round"
        lineJoin="round"
      />
    </Rect>
  );
}

// -----------------------------------------------------------------------------------------
// Probability bars

export interface BarHandle {
  node: Node;
  value: SimpleSignal<number>;
  fill: Reference<Rect>;
  label: Reference<Txt>;
}

/** A labelled horizontal probability bar whose length and number follow `value`. */
export function probBar(opts: {
  label: string;
  color: string;
  width?: number;
  labelWidth?: number;
  value?: number;
  digits?: number;
  height?: number;
  fontSize?: number;
  mono?: boolean;
  x?: number;
  y?: number;
}): BarHandle {
  const {
    label,
    color,
    width = 520,
    labelWidth = 200,
    value: v0 = 0,
    digits = 2,
    height = 30,
    fontSize = 26,
    mono = true,
    x = 0,
    y = 0,
  } = opts;
  const value = createSignal(v0);
  const fill = createRef<Rect>();
  const labelRef = createRef<Txt>();
  const node = (
    <Node x={x} y={y}>
      <Txt
        ref={labelRef}
        x={-width / 2 - 24}
        offsetX={1}
        text={label}
        fontFamily={mono ? MONO : FONT}
        fontWeight={500}
        fontSize={fontSize}
        fill={C.text}
      />
      <Rect x={0} width={width} height={height} radius={height / 2} fill={alpha('#94a3b8', 0.1)} />
      <Rect
        ref={fill}
        x={-width / 2}
        offsetX={-1}
        width={() => Math.max(height * 0.2, value() * width)}
        height={height}
        radius={height / 2}
        fill={color}
        opacity={() => (value() > 0.001 ? 1 : 0)}
        shadowColor={alpha(color, 0.55)}
        shadowBlur={18}
      />
      <Txt
        x={width / 2 + 24}
        offsetX={-1}
        text={() => value().toFixed(digits)}
        fontFamily={MONO}
        fontWeight={600}
        fontSize={fontSize}
        fill={C.text2}
      />
    </Node>
  ) as Node;
  void labelWidth;
  return {node, value, fill, label: labelRef};
}

// -----------------------------------------------------------------------------------------
// Motion helpers

/** Fade and rise into place. The node should start at opacity 0. */
export function* rise(node: Node, d = 0.7, dy = 36): ThreadGenerator {
  const y = node.y();
  node.y(y + dy);
  yield* all(node.opacity(1, d, easeOutCubic), node.y(y, d, easeOutCubic));
}

/** Scale in with a slight overshoot. The node should start at opacity 0. */
export function* pop(node: Node, d = 0.6, from = 0.6): ThreadGenerator {
  node.scale(from);
  yield* all(node.opacity(1, d * 0.6, easeOutCubic), node.scale(1, d, easeOutBack));
}

export function* fadeOut(node: Node, d = 0.4, dy = -20): ThreadGenerator {
  yield* all(node.opacity(0, d, easeInCubic), node.y(node.y() + dy, d, easeInCubic));
}

export function* pulse(node: Node, amount = 1.08, d = 0.5): ThreadGenerator {
  const s = node.scale.x();
  yield* node.scale(s * amount, d / 2, easeOutCubic).to(s, d / 2, easeInCubic);
}

/** Draws a line from its start. */
export function* draw(line: Line, d = 0.8): ThreadGenerator {
  line.end(0);
  line.opacity(1);
  yield* line.end(1, d, easeOutCubic);
}

/** A masked line of text that slides up into view. */
export function maskedText(props: TxtProps & {width: number; lineHeight?: number}) {
  const {width, lineHeight: lh, ...rest} = props;
  const fontSize = (rest.fontSize as number) ?? 76;
  const h = lh ?? fontSize * 1.35;
  const txt = createRef<Txt>();
  const node = (
    <Rect width={width} height={h} clip>
      <Txt ref={txt} y={h} {...rest} />
    </Rect>
  ) as Rect;
  return {
    node,
    txt,
    *in(d = 0.8) {
      txt().y(h);
      yield* txt().y(0, d, easeOutCubic);
    },
    *out(d = 0.5) {
      yield* txt().y(-h, d, easeInCubic);
    },
  };
}

export {Layout};

// -----------------------------------------------------------------------------------------
// Paths

type P = [number, number];

/** The point at fraction `p` of the way along a polyline. */
export function pointAlong(points: P[], p: number): P {
  const lengths = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let d = Math.min(Math.max(p, 0), 1) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (d <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] === 0 ? 0 : Math.min(1, d / lengths[i]);
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t];
    }
    d -= lengths[i];
  }
  return points[points.length - 1];
}

/** Moves a node along a polyline. */
export function* travel(node: Node, points: P[], d: number, ease: (t: number) => number = easeInOutCubicLocal): ThreadGenerator {
  yield* tween(d, (v) => node.position(pointAlong(points, ease(v))));
}

function easeInOutCubicLocal(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
