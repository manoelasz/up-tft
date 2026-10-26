"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const NAV = [
  { href: "/", label: "Top comps", icon: "M12 2 2 7l10 5 10-5-10-5zm0 13L2 10v2l10 5 10-5v-2l-10 5zm0 5-10-5v2l10 5 10-5v-2l-10 5z" },
  { href: "/jogador", label: "Buscar jogador", icon: "M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.42 1.4-5.39-5.38A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" },
  { href: "/campeoes", label: "Campeões", icon: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z" },
  { href: "/sobre", label: "Como funciona", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2">
      <Image src="/logo.webp" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-accent/40" priority />
      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight text-ink">
          Up <span className="text-accent">TFT</span>
        </div>
        <div className="text-xs uppercase tracking-[0.12em] text-muted">Meta ao vivo</div>
      </div>
    </Link>
  );
}

/** Reads the URL, so it must sit inside <Suspense>; the fallback is the same sidebar with nothing highlighted. */
export function Sidebar() {
  return (
    <Suspense fallback={<SidebarFrame pathname={null} />}>
      <SidebarWithPath />
    </Suspense>
  );
}

function SidebarWithPath() {
  return <SidebarFrame pathname={usePathname()} />;
}

function SidebarFrame({ pathname }: { pathname: string | null }) {
  return (
    <aside className="sticky top-0 z-20 flex shrink-0 flex-col gap-4 border-b border-line bg-surface/95 px-4 py-4 backdrop-blur md:h-screen md:w-60 md:border-b-0 md:border-r md:py-6">
      <Logo />
      <nav className="-mx-1 flex gap-1 overflow-x-auto md:mx-0 md:mt-4 md:flex-col md:overflow-visible">
        {NAV.map((item) => {
          const active = pathname !== null && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent-soft text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${active ? "fill-accent" : "fill-muted"}`} aria-hidden>
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
