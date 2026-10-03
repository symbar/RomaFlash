import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from '@/components/InstallPrompt';
import Script from 'next/script';

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

import TabBar from '@/components/TabBar';
import DesktopSidebar from '@/components/DesktopSidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider>
            <InstallPrompt />
            <div className="flex min-h-screen max-w-[1600px] mx-auto">
              <DesktopSidebar />
              <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
                {children}
              </div>
            </div>
            <TabBar />

        </ThemeProvider>
        {/* Cloudflare Web Analytics */}
        <Script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9ec688eb17b641bd998e97d1651c6cde"}'></Script>
      </body>

    </html>
  );
}




