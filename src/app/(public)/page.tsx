import dynamic from "next/dynamic";
import { Hero, Partners } from "@/components/sections";

const AboutGSAP = dynamic(() => import('@/components/sections/about-gsap').then(mod => mod.AboutGSAP));
const Events = dynamic(() => import('@/components/sections/events').then(mod => mod.Events));
const Staff = dynamic(() => import('@/components/sections/staff').then(mod => mod.Staff));
const FAQ = dynamic(() => import('@/components/sections/faq').then(mod => mod.FAQ));
const BanList = dynamic(() => import('@/components/sections/banlist').then(mod => mod.BanList));
const GalleryPreview = dynamic(() => import('@/components/sections/gallery-preview').then(mod => mod.GalleryPreview));
const MembersPreview = dynamic(() => import('@/components/sections/members-preview').then(mod => mod.MembersPreview));
const MenfessPreview = dynamic(() => import('@/components/sections/menfess-preview').then(mod => mod.MenfessPreview));

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
