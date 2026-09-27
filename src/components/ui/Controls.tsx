import { useId, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";

interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: ReactNode;
  accent?: string;
}

/** A labelled range input that shows its current value. */
export function Slider({ label, value, min, max, step = 1, onChange, format, hint, accent }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <div className="slider-top">
        <label htmlFor={id} className="slider-label">
          {label}
        </label>
        <output htmlFor={id} className="slider-value tabular">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": `${pct}%`, "--slider-accent": accent ?? "var(--accent)" } as CSSProperties}
      />
      {hint && <div className="slider-hint">{hint}</div>}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

/** A single-choice button group (radio semantics). */
export function Segmented<T extends string>({ label, options, value, onChange, size = "md" }: SegmentedProps<T>) {
  return (
    <div className={`segmented seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={`seg ${value === o.value ? "is-active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
  size?: "sm" | "md";
}

export function Button({ variant = "secondary", icon, size = "md", children, className, ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn btn-${variant} btn-${size} ${className ?? ""}`} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}
