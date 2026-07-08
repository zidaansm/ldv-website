import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Explore photos, videos, and memories from La Dolce Vita's community activities and gaming sessions.",
  openGraph: {
    title: "Gallery | La Dolce Vita",
    description: "Explore photos, videos, and memories from La Dolce Vita's community activities and gaming sessions.",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
