import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evolução AC — Alojamento Conjunto RN",
  description: "Evolução diária do recém-nascido em alojamento conjunto",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e6e6e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-primary text-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span aria-hidden className="text-lg">♦</span>
              <span>Evolução AC</span>
            </Link>
            <nav className="ml-auto flex gap-1 text-sm">
              <Link href="/evolucao" className="rounded-md px-3 py-1.5 hover:bg-white/15">
                Nova evolução
              </Link>
              <Link href="/passagem" className="rounded-md px-3 py-1.5 hover:bg-white/15">
                Passagem
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">{children}</main>
      </body>
    </html>
  );
}
