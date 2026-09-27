import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { Segmented, Slider } from "./Controls";
import { Figure } from "./Figure";
import { M, MathBlock } from "./Math";
import { Tabs } from "./Tabs";

describe("content primitives", () => {
  it("renders code with every line and a copy button", () => {
    const code = 'router = Router()\nresult = router.predict(state, questions)  # one pass';
    const { container } = render(<CodeBlock code={code} highlight={[2]} />);
    expect(container.querySelector("code")?.textContent).toBe(code + "\n");
    expect(container.querySelectorAll(".code-line.is-hl")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(container.querySelector(".tok-func")?.textContent).toBe("Router");
  });

  it("renders maths with KaTeX", () => {
    const { container } = render(
      <p>
        <M>{String.raw`p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}`}</M>
        <MathBlock label="softmax">{String.raw`\sum_i p_i = 1`}</MathBlock>
      </p>,
    );
    expect(container.querySelectorAll(".katex")).toHaveLength(2);
    expect(screen.getByText("softmax")).toBeInTheDocument();
  });

  it("switches tabs by click and arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="Examples"
        items={[
          { id: "a", label: "First", content: <p>panel one</p> },
          { id: "b", label: "Second", content: <p>panel two</p> },
        ]}
      />,
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("panel one");
    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("panel two");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "First" })).toHaveFocus();
  });

  it("reports slider and segmented changes", async () => {
    const user = userEvent.setup();
    const onSeg = vi.fn();
    render(
      <>
        <Slider label="Temperature" value={1} min={0.5} max={5} step={0.1} onChange={() => {}} format={(v) => v.toFixed(2)} />
        <Segmented label="Type" value="choice" onChange={onSeg} options={[{ value: "choice", label: "choice" }, { value: "noul", label: "noul" }]} />
      </>,
    );
    expect(screen.getByLabelText("Temperature")).toHaveValue("1");
    expect(screen.getByText("1.00")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "noul" }));
    expect(onSeg).toHaveBeenCalledWith("noul");
  });

  it("labels callouts and figures", () => {
    render(
      <>
        <Callout type="laya">Mirrors laya/common.py</Callout>
        <Figure title="Softmax playground" kind="simulation" caption="caption text">
          body
        </Figure>
      </>,
    );
    expect(screen.getByText("In Laya")).toBeInTheDocument();
    expect(screen.getByText("Simulation")).toBeInTheDocument();
    expect(screen.getByText("Softmax playground")).toBeInTheDocument();
  });
});
