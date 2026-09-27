/**
 * localStorage access that never throws. Storage can be unavailable (private windows, blocked
 * site data), and every caller treats a missing value as "use the default".
 */
const PREFIX = "s1-tutorial:";

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or disabled: the preference simply is not remembered.
  }
}
