import { useCallback, useEffect, useState } from "react";

/** `#/rlcd` -> `"rlcd"`; anything unrecognised -> null. */
export function parseHash(hash: string, known: (id: string) => boolean): string | null {
  const match = /^#\/([a-z0-9-]+)\/?$/.exec(hash);
  if (!match) return null;
  return known(match[1]) ? match[1] : null;
}

/**
 * The chapter named in the URL hash. Hash routing keeps the production build a static folder
 * that works from any path, with working back/forward buttons and shareable links.
 */
export function useHashRoute(known: (id: string) => boolean, fallback: string) {
  const read = useCallback(() => parseHash(window.location.hash, known) ?? fallback, [known, fallback]);
  const [route, setRoute] = useState<string>(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [read]);

  const navigate = useCallback((id: string) => {
    if (window.location.hash !== `#/${id}`) window.location.hash = `/${id}`;
    setRoute(id);
    window.scrollTo({ top: 0 });
  }, []);

  return [route, navigate] as const;
}
