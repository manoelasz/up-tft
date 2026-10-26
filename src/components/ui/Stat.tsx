/** A labelled number, e.g. "Top 4 / 62%". `highlight` marks the stat the view is ranked by. */
export function Stat({
  label,
  value,
  size = "md",
  highlight = false,
}: {
  label: string;
  value: string;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}) {
  const valueSize = { sm: "text-sm", md: "text-lg", lg: "text-2xl" }[size];
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className={`tabular font-semibold ${valueSize} ${highlight ? "text-accent" : "text-ink"}`}>{value}</div>
    </div>
  );
}
