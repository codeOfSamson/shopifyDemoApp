import "./globals.css";
import { AppShell } from "@repo/ui";

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
    <html lang="en">
      <body className="font-sans">
        <AppShell title="Tech Inventory" navLinks={navLinks}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
