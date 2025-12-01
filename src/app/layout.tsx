import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adventcord",
  description: "Discord webhook notifications for Advent of Code leaderboards",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceCodePro.variable} font-mono antialiased`}>
        <div className="min-h-screen">
          <header className="border-b border-input-border py-4">
            <nav className="max-w-4xl mx-auto px-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="text-gold font-bold hover:text-gold">
                  Adventcord
                </Link>
                <span className="text-foreground/50">|</span>
                <Link href="/create">[Create]</Link>
                <Link href="/edit">[View / Edit]</Link>
                <span className="text-foreground/50">|</span>
                <Link href="/faqs">[FAQs]</Link>
                <Link href="/donate">[Donate]</Link>
              </div>
            </nav>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
