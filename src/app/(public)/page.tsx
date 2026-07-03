import { Hero, Events, Staff, FAQ, BanList, GalleryPreview, Partners, MembersPreview, MenfessPreview } from "@/components/sections";
import { AboutGSAP } from "@/components/sections/about-gsap";

export default function Home() {
  return (
    <main>
      <Hero />
      <Partners />
      <AboutGSAP />
      <Events />
      
      {/* Community Section: Members & Menfess */}
      <MembersPreview direction="left" speed={30} />
      <MenfessPreview />
      <MembersPreview direction="right" speed={30} />

      <GalleryPreview />
      <Staff />
      
      <FAQ />
      <BanList />
    </main>
  );
}
