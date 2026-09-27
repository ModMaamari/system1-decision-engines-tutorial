import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SORTER_TASKS, SystemSorter } from "./SystemSorter";

describe("SystemSorter", () => {
  it("gives feedback and keeps score", async () => {
    const user = userEvent.setup();
    render(<SystemSorter />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(SORTER_TASKS.length);

    // Task 1 is a System 1 task, task 2 a System 2 task.
    await user.click(screen.getAllByRole("button", { name: "System 1" })[0]);
    await user.click(screen.getAllByRole("button", { name: "System 1" })[1]);
    expect(screen.getByText("1 of 2 answered correctly")).toBeInTheDocument();
    expect(screen.getByText(/Better: System 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText(`${SORTER_TASKS.length} tasks`)).toBeInTheDocument();
  });
});
