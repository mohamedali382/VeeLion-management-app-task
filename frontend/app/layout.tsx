import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeeLion Frontend Assessment",
  description: "Task management, activity, and reporting workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand" aria-label="VeeLion home">
                <span className="brand-mark" aria-hidden="true">V</span>
                <span className="brand-name">VeeLion</span>
              </Link>
              <nav className="main-nav" aria-label="Main navigation">
                <Link href="/tasks">Tasks</Link>
                <Link href="/activity">Activity</Link>
                <Link href="/reports">Reports</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
