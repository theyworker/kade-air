import type { NextConfig } from "next";

// Next serves everything in public/ with `max-age=0`, so the browser
// revalidates all 30 thumbnails on every screen that shows them — prefetching
// saves the bytes but not the round-trips. The art is versioned by filename
// (the V2 set landed under new names), so it can be cached hard: a week fresh
// with a month of background revalidation, so a redeploy still propagates.
const ART_CACHE = "public, max-age=604800, stale-while-revalidate=2592000";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
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
