import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <main style={{ maxWidth: "var(--reading-width)", margin: "0 auto", padding: "var(--space-7) var(--space-4)" }}>
      <h1>System 1 Decision Engines</h1>
      <p>An interactive tutorial on non-autoregressive decision models.</p>
      <button type="button" onClick={toggle}>
        Switch to {theme === "dark" ? "light" : "dark"} theme
      </button>
    </main>
  );
}
