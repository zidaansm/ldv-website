import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
  description: "Meet the incredible members of La Dolce Vita Discord community. Connect, socialize, and play together.",
  openGraph: {
    title: "Members | La Dolce Vita",
    description: "Meet the incredible members of La Dolce Vita Discord community. Connect, socialize, and play together.",
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
