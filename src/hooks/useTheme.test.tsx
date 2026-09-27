import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  it("applies the theme to the document element", () => {
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.dataset.theme).toBe(result.current.theme);
  });

  it("toggles and remembers the choice", () => {
    const { result } = renderHook(() => useTheme());
    const first = result.current.theme;
    act(() => result.current.toggle());
    const second = result.current.theme;
    expect(second).not.toBe(first);
    expect(document.documentElement.dataset.theme).toBe(second);
    expect(window.localStorage.getItem("s1-tutorial:theme")).toBe(JSON.stringify(second));

    // A fresh mount reads the stored choice back.
    const { result: again } = renderHook(() => useTheme());
    expect(again.current.theme).toBe(second);
  });
});
