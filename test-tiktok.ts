import { getTikTokVideoId } from "./src/lib/tiktok";

async function test() {
  const url = "https://www.tiktok.com/@ldvarch/video/7655947701607075093?is_from_webapp=1&sender_device=pc&web_id=7508842332423964167";
  console.log("Extracted ID:", await getTikTokVideoId(url));
}

test();
