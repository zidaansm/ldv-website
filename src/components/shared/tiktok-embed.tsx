"use client";

/**
 * Extracts TikTok video ID purely client-side via regex.
 * Works for URLs like:
 * - https://www.tiktok.com/@user/video/7655947701607075093
 * - https://www.tiktok.com/@user/video/7655947701607075093?query=...
 */
function extractTikTokId(url: string): string | null {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

export function TikTokEmbed({ url }: { url: string }) {
  const videoId = extractTikTokId(url);

  if (!videoId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-6 text-center gap-3">
        <svg className="w-10 h-10 opacity-50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
        </svg>
        <p className="text-sm font-semibold">Could not load TikTok video</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-70 hover:opacity-100 break-all">Open on TikTok</a>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
        className="absolute inset-0 w-full h-full border-0"
        allow="encrypted-media; fullscreen; autoplay"
        title="TikTok Video"
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
      />
    </div>
  );
}
