import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RomaFlash | L'essenza delle notizie",
  description: "Notizie sull'AS Roma riassunte dall'AI. Veloce, pulito e in dark mode.",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

import { Home, Bookmark, User } from 'lucide-react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground pb-20">
        
        {children}

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-2xl mx-auto px-6 py-3 flex justify-between items-center">
            <button className="flex flex-col items-center gap-1 text-primary">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Feed</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
              <Bookmark className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Salvati</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
              <User className="w-6 h-6" />
              <span className="text-[10px] font-semibold">Profilo</span>
            </button>
          </div>
        </nav>
      </body>
    </html>
  );
}
