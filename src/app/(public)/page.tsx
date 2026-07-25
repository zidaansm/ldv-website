import dynamic from "next/dynamic";
import { Hero, Partners } from "@/components/sections";
import { createClient } from "@supabase/supabase-js";

// ISR: Cache this page for 60 seconds
export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AboutGSAP = dynamic(() => import('@/components/sections/about-gsap').then(mod => mod.AboutGSAP));
const Events = dynamic(() => import('@/components/sections/events').then(mod => mod.Events));
const Staff = dynamic(() => import('@/components/sections/staff').then(mod => mod.Staff));
const FAQ = dynamic(() => import('@/components/sections/faq').then(mod => mod.FAQ));
const BanList = dynamic(() => import('@/components/sections/banlist').then(mod => mod.BanList));
const GalleryPreview = dynamic(() => import('@/components/sections/gallery-preview').then(mod => mod.GalleryPreview));
const MembersPreview = dynamic(() => import('@/components/sections/members-preview').then(mod => mod.MembersPreview));
const MenfessPreview = dynamic(() => import('@/components/sections/menfess-preview').then(mod => mod.MenfessPreview));

export default async function Home() {
  // Server-Side Data Fetching for all sections (reduces client egress massively)
  const [eventsRes, membersRes, galleryRes, staffRes, menfessRes, faqRes, banlistRes] = await Promise.all([
    supabase.from("events").select("*").order("date", { ascending: false }),
    supabase.from("members").select("*").limit(50),
    supabase.from("gallery").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("staff").select("*").order("created_at", { ascending: true }),
    supabase.from("menfess").select("*, menfess_comments(id), menfess_likes(id)").eq("is_approved", true).order("created_at", { ascending: false }).limit(50),
    supabase.from("faq").select("*").order("created_at", { ascending: true }),
    supabase.from("banlist").select("*").order("banned_at", { ascending: false }),
  ]);

  const menfessPosts = menfessRes.data ? [...menfessRes.data].sort((a, b) => {
    const scoreA = (a.menfess_comments?.length || 0) + (a.menfess_likes?.length || 0);
    const scoreB = (b.menfess_comments?.length || 0) + (b.menfess_likes?.length || 0);
    return scoreB - scoreA;
  }).slice(0, 3) : [];
  const memberAvatars = membersRes.data?.map(m => m.avatar_url).filter(Boolean) || [];

  return (
    <main>
      <Hero />
      <Partners />
      <AboutGSAP />
      <Events initialEvents={eventsRes.data || []} />
      
      {/* Community Section: Members & Menfess */}
      <MembersPreview direction="left" speed={30} initialMembers={membersRes.data || []} />
      <MenfessPreview initialPosts={menfessPosts} initialAvatars={memberAvatars} />
      <MembersPreview direction="right" speed={30} initialMembers={membersRes.data || []} />

      <GalleryPreview initialImages={galleryRes.data || []} />
      <Staff initialStaff={staffRes.data || []} />
      
      <FAQ initialFaqs={faqRes.data || []} />
      <BanList initialBanList={banlistRes.data || []} />
    </main>
  );
}
