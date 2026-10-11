import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://romaflash.app"),
  title: {
    default: "RomaFlash | L'essenza delle notizie giallorosse",
    template: "%s | RomaFlash",
  },
  description: "Notizie sull'AS Roma in tempo reale riassunte dall'AI. Probabili formazioni, calciomercato, calendario e classifica. Veloce, pulito, senza pubblicità.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/apple-icon",
  },
  alternates: {
    canonical: "https://romaflash.app",
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://romaflash.app",
    siteName: "RomaFlash",
    title: "RomaFlash | L'essenza delle notizie giallorosse",
    description: "Notizie sull'AS Roma in tempo reale riassunte dall'AI. Veloce, pulito, senza pubblicità.",
    images: [
      {
        url: "https://romaflash.app/icon",
        width: 512,
        height: 512,
        alt: "RomaFlash",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "RomaFlash | L'essenza delle notizie giallorosse",
    description: "Notizie sull'AS Roma in tempo reale riassunte dall'AI. Veloce, pulito, senza pubblicità.",
    images: ["https://romaflash.app/icon"],
  },
};

import TabBar from '@/components/TabBar';
import GlobalFooter from '@/components/GlobalFooter';
import { LanguageProvider } from '@/components/LanguageContext';

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RomaFlash",
  alternateName: "RomaFlash — L'essenza delle notizie giallorosse",
  url: "https://romaflash.app",
  inLanguage: ["it-IT", "en-GB"],
  publisher: {
    "@type": "Organization",
    name: "RomaFlash",
    url: "https://romaflash.app",
    logo: {
      "@type": "ImageObject",
      url: "https://romaflash.app/icon",
    },
  },
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <LanguageProvider>
          <InstallPrompt />
          <div className="flex min-h-screen max-w-[1600px] mx-auto">
            <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
              {children}
              <GlobalFooter />
            </div>
          </div>
          <TabBar />
        </LanguageProvider>

        {/* Cloudflare Web Analytics */}
        <Script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9ec688eb17b641bd998e97d1651c6cde"}'></Script>
      </body>

    </html>
  );
}




