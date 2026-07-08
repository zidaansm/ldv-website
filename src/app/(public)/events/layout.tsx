import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse all ongoing, upcoming, and past La Dolce Vita events. Register and participate in our community events.",
  openGraph: {
    title: "Events | La Dolce Vita",
    description: "Browse all ongoing, upcoming, and past La Dolce Vita events. Register and participate in our community events.",
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
