import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { ChatWidget } from "@/components/shared/chat-widget";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { MenfessLiveToaster } from "@/components/sections/menfess-live-toaster";
import { MotionProvider } from "@/components/providers/motion-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ldvarch.com"),
  title: {
    default: "LDV — Discord Community",
    template: "%s | LDV",
  },
  description:
    "A Discord community for socializing, gaming, and late-night grinds. Enjoy plenty of premium bots for free here. Come join us!",
  keywords: [
    "Discord",
    "community",
    "gaming",
    "La Dolce Vita",
    "LDV",
    "server",
  ],
  authors: [{ name: "La Dolce Vita" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ldvarch.com",
    siteName: "La Dolce Vita",
    title: "La Dolce Vita — Premium Discord Community",
    description:
      "A Discord community for socializing, gaming, and late-night grinds. Enjoy plenty of premium bots for free here. Come join us!",
    images: [
      {
        url: "/og/og-default.png",
        width: 1200,
        height: 630,
        alt: "La Dolce Vita",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "La Dolce Vita — Premium Discord Community",
    description:
      "A Discord community for socializing, gaming, and late-night grinds. Enjoy plenty of premium bots for free here. Come join us!",
    images: ["/og/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "Yas3f27XTpbtd6L5D8sUPU7r3Hw4yoz1XSN71ebVmc0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body
        className="font-sans bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground min-h-screen flex flex-col overflow-x-hidden"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
        suppressHydrationWarning
      >
        <CustomCursor />
        <MotionProvider>
          <LanguageProvider>
            <ToastProvider />
            <MenfessLiveToaster />
            <main className="flex-grow">
              {children}
            </main>
            <ChatWidget />
          </LanguageProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
