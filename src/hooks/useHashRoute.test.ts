import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseHash, useHashRoute } from "./useHashRoute";

const known = (id: string) => ["intro", "rlcd"].includes(id);

describe("parseHash", () => {
  it("reads a known chapter id", () => {
    expect(parseHash("#/rlcd", known)).toBe("rlcd");
    expect(parseHash("#/rlcd/", known)).toBe("rlcd");
  });

  it("rejects unknown or malformed hashes", () => {
    expect(parseHash("#/nope", known)).toBeNull();
    expect(parseHash("#rlcd", known)).toBeNull();
    expect(parseHash("", known)).toBeNull();
    expect(parseHash("#/RLCD", known)).toBeNull();
  });
});

describe("useHashRoute", () => {
  it("falls back to the default and navigates", () => {
    const { result } = renderHook(() => useHashRoute(known, "intro"));
    expect(result.current[0]).toBe("intro");
    act(() => result.current[1]("rlcd"));
    expect(result.current[0]).toBe("rlcd");
    expect(window.location.hash).toBe("#/rlcd");
  });

  it("follows hash changes made outside the app", () => {
    const { result } = renderHook(() => useHashRoute(known, "intro"));
    act(() => {
      window.location.hash = "/rlcd";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current[0]).toBe("rlcd");
  });
});
