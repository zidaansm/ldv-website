import { SplashScreen } from "@/components/ui/splash-screen";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PresenceTracker } from "@/components/shared";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SplashScreen />
      <PresenceTracker />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
