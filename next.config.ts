import type { NextConfig } from "next";

// Next serves everything in public/ with `max-age=0`, so the browser
// revalidates all 30 thumbnails on every screen that shows them — prefetching
// saves the bytes but not the round-trips. The art is versioned by filename
// (the V2 set landed under new names), so it can be cached hard: a week fresh
// with a month of background revalidation, so a redeploy still propagates.
const ART_CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  // The OG image route reads the logo and its fonts off the filesystem, but
  // Next traces only what it can see imported — and `public/` is served by the
  // CDN, not bundled into the function. Without this the route throws ENOENT in
  // the Lambda and every shared link loses its preview card, while working
  // perfectly in dev, where the files happen to sit at the working directory.
  //
  // No dish art here on purpose: the card shows a wrapped gift, never the dish,
  // so the 30 icons would be dead weight in the bundle.
  outputFileTracingIncludes: {
    "/d/[code]/opengraph-image": ["./public/brand/**", "./assets/fonts/**"],
  },

  async headers() {
    return [
      {
        source: "/:dir(food|brand)/:file*",
        headers: [{ key: "Cache-Control", value: ART_CACHE }],
      },
    ];
  },
};

export default nextConfig;
