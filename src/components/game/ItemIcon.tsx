"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ItemRef } from "@/lib/types";

/** Item name and recipe, rendered in a portal so board hexes and scroll areas can't clip it. */
function ItemTooltip({ item, anchor }: { item: ItemRef; anchor: DOMRect }) {
  const below = anchor.top < 120;
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-max max-w-64 rounded-lg border border-line bg-surface-2 px-3 py-2.5 shadow-xl"
      style={{
        left: anchor.left + anchor.width / 2,
        top: below ? anchor.bottom + 8 : anchor.top - 8,
        transform: `translate(-50%, ${below ? "0" : "-100%"})`,
      }}
    >
      <div className="text-sm font-semibold text-ink">{item.name}</div>
      {item.components ? (
        <div className="mt-2 flex flex-col gap-1.5">
          {item.components.map((c, i) => (
            <div key={`${c.id}-${i}`} className="flex items-center gap-2 text-sm text-ink-2">
              {c.icon && <Image src={c.icon} alt="" width={22} height={22} className="rounded-[3px]" />}
              {c.name}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted">Não é montado com componentes</div>
      )}
    </div>,
    document.body,
  );
}

/** Item icon; hover, tap or focus shows the recipe. */
export function ItemIcon({ item, size = 18 }: { item: ItemRef; size?: number }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  // A fixed tooltip would drift away from its icon on scroll, so close it instead.
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [anchor]);

  if (!item.icon) return null;
  const open = (e: React.SyntheticEvent<HTMLElement>) => setAnchor(e.currentTarget.getBoundingClientRect());
  const close = () => setAnchor(null);

  return (
    <span
      tabIndex={0}
      aria-label={item.components ? `${item.name}: ${item.components.map((c) => c.name).join(" + ")}` : item.name}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      onClick={(e) => (anchor ? close() : open(e))}
      className="inline-flex cursor-help rounded-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Image src={item.icon} alt="" width={size} height={size} className="rounded-[3px] ring-1 ring-black/60" />
      {anchor && <ItemTooltip item={item} anchor={anchor} />}
    </span>
  );
}

/** A row of item icons; duplicates are allowed (two of the same item is a valid build). */
export function ItemRow({
  items,
  size,
  className = "",
  reserveSpace = false,
}: {
  items: ItemRef[];
  size: number;
  className?: string;
  /** Keep the row's height when empty, so neighbouring portraits stay aligned. */
  reserveSpace?: boolean;
}) {
  return (
    <div className={`flex justify-center gap-px ${className}`} style={reserveSpace ? { minHeight: size } : undefined}>
      {items.map((it, i) => (
        <ItemIcon key={`${it.id}-${i}`} item={it} size={size} />
      ))}
    </div>
  );
}
