import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RF Stats",
  manifest: "/manifest-stats.json",
  icons: {
    icon: "/stats/icon",
    shortcut: "/stats/icon",
    apple: "/stats/apple-icon",
  },
  appleWebApp: {
    capable: true,
    title: "RF Stats",
    statusBarStyle: "default",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
