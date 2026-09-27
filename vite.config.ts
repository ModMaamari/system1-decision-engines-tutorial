import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the production build works from any folder (or opened from a static host).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
