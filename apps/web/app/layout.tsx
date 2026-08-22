import "./globals.css";
import { Inter } from "next/font/google";
import { TopNav, type NavLink } from "@repo/ui";
import { ReportWebVitals } from "./ReportWebVitals";

// Loads the actual Inter typeface referenced by --font-sans in
// packages/ui/src/theme.css (which only declares the font-family name —
// it doesn't load it). variable ties the loaded font to the CSS variable
// Tailwind's font-sans utility resolves to.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Same two destinations/labels as apps/inventory-ops's AppShell nav
// ("Storefront", "Inventory") so the two zones read as one product; Cart
// is an extra, web-only entry.
const navLinks: NavLink[] = [
  { href: "/", label: "Storefront" },
  { href: "/cart", label: "Cart" },
  { href: "/inventory", label: "Inventory" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-slate-50 text-slate-900">
        <ReportWebVitals />
        <TopNav title="HLTH Shop" navLinks={navLinks} />
        <div className="p-6">{children}</div>
      </body>
    </html>
  );
}
