import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProgress } from "./useProgress";

const ids = ["a", "b", "c"];

describe("useProgress", () => {
  it("marks, toggles and persists completed chapters", () => {
    const { result } = renderHook(() => useProgress(ids));
    act(() => result.current.markComplete("a"));
    act(() => result.current.toggleComplete("b"));
    expect([...result.current.completed].sort()).toEqual(["a", "b"]);
    act(() => result.current.toggleComplete("b"));
    expect([...result.current.completed]).toEqual(["a"]);

    const { result: again } = renderHook(() => useProgress(ids));
    expect([...again.current.completed]).toEqual(["a"]);
  });

  it("ignores stored ids that are no longer chapters and malformed storage", () => {
    window.localStorage.setItem("s1-tutorial:completed", JSON.stringify(["a", "gone", 3]));
    const { result } = renderHook(() => useProgress(ids));
    expect([...result.current.completed]).toEqual(["a"]);

    window.localStorage.setItem("s1-tutorial:completed", "{not json");
    const { result: broken } = renderHook(() => useProgress(ids));
    expect(broken.current.completed.size).toBe(0);
  });
});
