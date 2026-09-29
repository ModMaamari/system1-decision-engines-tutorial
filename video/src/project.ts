import {makeProject} from '@motion-canvas/core';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/noto-sans-devanagari/500.css';
import '@fontsource/noto-sans-arabic/500.css';
import '@fontsource/noto-sans-khmer/500.css';

import voiceover from '../narration/voiceover.ogg';

import s01 from './scenes/s01_open?scene';
import s02 from './scenes/s02_problem?scene';
import s03 from './scenes/s03_fastslow?scene';
import s04 from './scenes/s04_arnar?scene';
import s05 from './scenes/s05_primitives?scene';
import s06 from './scenes/s06_sequence?scene';
import s07 from './scenes/s07_forward?scene';
import s08 from './scenes/s08_decoding?scene';
import s09 from './scenes/s09_scoring?scene';
import s10 from './scenes/s10_rlcd?scene';
import s11 from './scenes/s11_calibration?scene';
import s12 from './scenes/s12_router?scene';
import s13 from './scenes/s13_production?scene';
import s14 from './scenes/s14_agents?scene';
import s15 from './scenes/s15_limits?scene';
import s16 from './scenes/s16_outro?scene';

// Canvas text only uses a web font once it has loaded, so load every face before the project
// (and therefore the first frame) is created.
await Promise.all(
  [
    '400 32px "Inter Variable"',
    '800 32px "Inter Variable"',
    '500 32px "JetBrains Mono Variable"',
    '700 32px "JetBrains Mono Variable"',
    '500 32px "Noto Sans Devanagari"',
    '500 32px "Noto Sans Arabic"',
    '500 32px "Noto Sans Khmer"',
  ].map((font) => document.fonts.load(font, font.includes('Devanagari') ? 'क' : font.includes('Arabic') ? 'ع' : font.includes('Khmer') ? 'ក' : 'A')),
);

export default makeProject({
  name: 'system1-decision-engines',
  scenes: [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16],
  audio: voiceover,
});
