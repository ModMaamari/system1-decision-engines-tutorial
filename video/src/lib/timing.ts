import {useThread, waitFor} from '@motion-canvas/core';
import timeline from '../timeline.json';

export interface Beat {
  start: number;
  end: number;
  text: string;
  /** Word start times (seconds from the start of the scene), from speech-to-text alignment. */
  words?: [string, number][];
}

export interface SceneTiming {
  id: string;
  part: string;
  title: string;
  /** Start of the scene in the whole video, in seconds. */
  start: number;
  duration: number;
  frames: number;
  /** Narration beats, in seconds from the start of the scene. */
  beats: Record<string, Beat>;
}

export const FPS: number = timeline.fps;
export const TOTAL: number = timeline.duration;
export const SCENES = timeline.scenes as unknown as SceneTiming[];

/** Timing for one scene, generated from the narration clips by scripts/narration.mjs. */
export function timing(id: string): SceneTiming & {index: number; previous?: SceneTiming} {
  const index = SCENES.findIndex((s) => s.id === id);
  if (index < 0) throw new Error(`no timeline entry for scene ${id}`);
  return {...SCENES[index], index, previous: SCENES[index - 1]};
}

/** Wait until `t` seconds after the start of the current scene. Never waits backwards. */
export function* at(t: number) {
  const now = useThread().time();
  if (t > now + 1e-6) yield* waitFor(t - now);
}

/** Seconds from now until `t` (scene time), for sizing an animation to fit before a beat. */
export function until(t: number) {
  return Math.max(0, t - useThread().time());
}

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The moment a phrase starts being spoken inside a beat. Uses aligned word times when the
 * timeline has them, otherwise estimates from the phrase's position in the text.
 */
export function cue(beat: Beat, phrase?: string, offset = 0): number {
  if (!phrase) return beat.start + offset;
  const i = beat.text.indexOf(phrase);
  if (i < 0) throw new Error(`"${phrase}" is not in "${beat.text}"`);
  if (beat.words?.length) {
    const target = phrase.split(/[\s-]+/).map(norm).filter(Boolean);
    const words = beat.words.map(([w, t]) => [norm(w), t] as const);
    for (let k = 0; k < words.length; k++) {
      if (words[k][0] !== target[0]) continue;
      if (target.length > 1 && words[k + 1] && words[k + 1][0] !== target[1]) continue;
      return words[k][1] + offset;
    }
  }
  return beat.start + (beat.end - beat.start) * (i / beat.text.length) + offset;
}
