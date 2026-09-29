import {defineConfig} from 'vite';
import motionCanvasPlugin from '@motion-canvas/vite-plugin';
import masterExporter from './plugins/master-exporter/server';

// The Motion Canvas plugin is published as CommonJS; unwrap the default export when needed.
const motionCanvas = ((motionCanvasPlugin as any).default ?? motionCanvasPlugin) as typeof motionCanvasPlugin;

export default defineConfig({
  plugins: [motionCanvas(), masterExporter('./output')],
  server: {port: 9000},
});
