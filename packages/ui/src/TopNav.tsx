import type { ReactNode } from "react";
import type { NavLink } from "./AppShell";

export type TopNavProps = {
  title: string;
  navLinks: NavLink[];
};

// Top-bar chrome counterpart to AppShell's sidebar — same color/spacing/
// typography tokens (border-slate-200, bg-white, text-slate-900/600,
// text-sm font-medium) so the two zones read as one product even though
// one uses a sidebar (dashboard-style) and the other a header (shop-style).
//
// Plain <a> tags, deliberately not next/link: nav between the two
// micro-frontend zones must be a full page load, not client-side routing
// (same reasoning as AppShell).
export function TopNav({ title, navLinks }: TopNavProps): ReactNode {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <a href="/" className="text-lg font-semibold text-slate-900">
        {title}
      </a>
      <nav className="flex gap-4 text-sm font-medium text-slate-600">
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-slate-900">
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
