import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAP Guru AI Control Center",
  description: "AI engagement dashboard for conversations, leads and automation",
};

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Inbox", href: "/inbox" },
  { label: "Leads", href: "/leads" },
  { label: "Business Brain", href: "/business-brain" },
  { label: "Analytics", href: "/analytics" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Settings", href: "/settings" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-white">
        <div className="flex min-h-screen">
          <aside className="w-72 border-r border-slate-800 bg-slate-950 px-5 py-6">
            <div className="mb-8">
              <div className="text-xl font-bold">SAP Guru AI</div>
              <div className="text-xs text-slate-400 mt-1">
                Control Center
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-8 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">
                  AI Customer Engagement Platform
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
                <span className="text-slate-400">The SAP Guru</span>
              </div>
            </header>

            <main className="p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}