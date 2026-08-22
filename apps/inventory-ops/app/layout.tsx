import "./globals.css";
import { Inter } from "next/font/google";
import { AppShell } from "@repo/ui";

// Loads the actual Inter typeface referenced by --font-sans in
// packages/ui/src/theme.css (which only declares the font-family name —
// it doesn't load it). variable ties the loaded font to the CSS variable
// Tailwind's font-sans utility resolves to. Kept consistent with
// apps/web/app/layout.tsx.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const navLinks = [
  { href: "/", label: "Storefront" },
  { href: "/inventory", label: "Inventory" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AppShell title="Tech Inventory" navLinks={navLinks}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
