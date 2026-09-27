import { useCallback, useState } from "react";
import { readStored, writeStored } from "../lib/storage";

/** Chapters the reader has finished, remembered across visits in this browser. */
export function useProgress(validIds: readonly string[]) {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(() => {
    const stored = readStored<unknown>("completed", []);
    const ids = Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
    return new Set(ids.filter((id) => validIds.includes(id)));
  });

  const update = useCallback((fn: (prev: Set<string>) => void) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      fn(next);
      writeStored("completed", [...next]);
      return next;
    });
  }, []);

  const markComplete = useCallback((id: string) => update((s) => s.add(id)), [update]);
  const toggleComplete = useCallback(
    (id: string) => update((s) => (s.has(id) ? s.delete(id) : s.add(id))),
    [update],
  );
  const reset = useCallback(() => update((s) => s.clear()), [update]);

  return { completed, markComplete, toggleComplete, reset };
}
