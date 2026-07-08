import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menfess (Mention Confess)",
  description: "Share your anonymous confessions and messages with the La Dolce Vita community. Live menfess board.",
  openGraph: {
    title: "Menfess | La Dolce Vita",
    description: "Share your anonymous confessions and messages with the La Dolce Vita community. Live menfess board.",
  },
};

export default function MenfessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
