"use client";

/** A row of mutually exclusive buttons (e.g. "Campeões | Tabuleiro"). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-line bg-bg p-0.5 text-sm">
      {options.map(([key, label]) => (
        <button
          key={key}
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
            value === key ? "bg-accent-strong text-white" : "text-ink-2 hover:text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
