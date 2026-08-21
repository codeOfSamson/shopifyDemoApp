import "./globals.css";
import { ReportWebVitals } from "./ReportWebVitals";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        <ReportWebVitals />
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <a href="/" className="text-lg font-semibold">
            HLTH Shop
          </a>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <a href="/cart" className="hover:text-slate-900">
              Cart
            </a>
            <a href="/inventory" className="hover:text-slate-900">
              Inventory
            </a>
          </nav>
        </header>
        <div className="p-6">{children}</div>
      </body>
    </html>
  );
}
