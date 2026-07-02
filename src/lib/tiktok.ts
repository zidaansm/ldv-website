"use server";

export async function getTikTokVideoId(url: string): Promise<string | null> {
  if (!url) return null;

  try {
    // If it's a short URL, we need to resolve the redirect
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      const response = await fetch(url, { redirect: 'follow' });
      url = response.url;
    }

    // Extract the video ID from the final URL
    // Format: https://www.tiktok.com/@username/video/123456789...
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Failed to resolve TikTok URL:", error);
    return null;
  }
}
