import type { MetadataRoute } from 'next';

// Served at /robots.txt.
//
// Note what this deliberately does NOT do: it does not `Disallow: /d/`.
// Two reasons, and both matter more than they look:
//
//  1. robots.txt controls *crawling*, not *indexing*. A disallowed URL can
//     still be listed by Google if it's discovered elsewhere. Worse, a
//     crawler that is blocked here can never fetch the page to read the
//     `noindex` directive that actually removes it. Blocking is the weaker
//     guarantee, and it cancels out the stronger one.
//  2. Link previews are this app's entire distribution mechanism. Twitterbot
//     and facebookexternalhit honour robots.txt, so disallowing /d/ would
//     strip the preview card off every shared link.
//
// The real protection is `robots: { index: false, follow: false }` in
// app/d/[token]/page.tsx, which emits <meta name="robots" content="noindex,
// nofollow"> on every delivery page. Crawlers may fetch it (so previews keep
// working) and are told in the clearest available terms not to index it.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Next.js internals and the generated OG images carry no standalone
        // value in an index and only dilute the real pages.
        disallow: ['/_next/', '/d/*/opengraph-image'],
      },
    ],
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
