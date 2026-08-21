import type { ReactNode } from "react";

export type NavLink = {
  href: string;
  label: string;
};

export type AppShellProps = {
  title: string;
  navLinks: NavLink[];
  children: ReactNode;
};

// Plain <a> tags, deliberately not next/link: nav between the two
// micro-frontend zones must be a full page load, not client-side routing.
export function AppShell({ title, navLinks, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2 text-lg font-semibold text-slate-900">{title}</div>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
