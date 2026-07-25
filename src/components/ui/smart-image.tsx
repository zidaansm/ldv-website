/**
 * Use `unoptimized` on Next.js Image for all external URLs.
 * This bypasses Vercel's image proxy (/_next/image) which often fails
 * for Roblox CDN, Supabase Storage, and other external sources due to
 * rate-limiting, timeouts, or CORS issues in production.
 *
 * We set `unoptimized={true}` so Next.js renders a plain <img> tag
 * for external URLs while keeping the nice API (fill, sizes, etc.).
 */

import NextImage, { ImageProps } from "next/image";

function isExternal(src: string | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  return src.startsWith("http://") || src.startsWith("https://");
}

export default function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : undefined;
  return <NextImage {...props} unoptimized={isExternal(src)} />;
}
