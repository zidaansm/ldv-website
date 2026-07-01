import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CustomCursor } from "@/components/ui/custom-cursor";
import "./globals.css";
import { ToastProvider } from "@/components/providers/ToastProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ldv.gg"),
  title: {
    default: "LDV — Discord Community",
    template: "%s | LDV",
  },
  description:
    "Komunitas Discord buat sosial, gaming, dan nyawit bareng. Banyak bot premium yang bisa dipake gratis di sini. Yuk gabung!",
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
    url: "https://ldv.gg",
    siteName: "La Dolce Vita",
    title: "La Dolce Vita — Premium Discord Community",
    description:
      "Komunitas Discord buat sosial, gaming, dan nyawit bareng. Banyak bot premium yang bisa dipake gratis di sini. Yuk gabung!",
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
      "Komunitas Discord buat sosial, gaming, dan nyawit bareng. Banyak bot premium yang bisa dipake gratis di sini. Yuk gabung!",
    images: ["/og/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
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
        className="font-sans bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
        suppressHydrationWarning
      >
        <CustomCursor />
        <LanguageProvider>
          <ToastProvider />
          <main className="flex-grow">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
