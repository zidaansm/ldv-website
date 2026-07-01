import { Hero, Events, Staff, FAQ, BanList, GalleryPreview, Partners } from "@/components/sections";
import { AboutGSAP } from "@/components/sections/about-gsap";

export default function Home() {
  return (
    <main>
      <Hero />
      <Partners />
      <AboutGSAP />
      <Events />
      <GalleryPreview />
      <Staff />
      <FAQ />
      <BanList />
    </main>
  );
}
