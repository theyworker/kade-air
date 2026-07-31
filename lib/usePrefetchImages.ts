'use client';

import { useEffect } from 'react';

// URLs already requested this session. The HTTP cache would dedupe anyway,
// but this keeps re-mounts from queueing work that has nothing left to do.
const requested = new Set<string>();

type Connection = { saveData?: boolean; effectiveType?: string };

// Warming 500KB of art is a favour, not an obligation — skip it entirely when
// the user is paying by the megabyte or crawling along on 2G.
function shouldSkip(): boolean {
  const c = (navigator as Navigator & { connection?: Connection }).connection;
  if (!c) return false;
  return c.saveData === true || c.effectiveType === 'slow-2g' || c.effectiveType === '2g';
}

const onIdle: (cb: () => void) => number =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => window.setTimeout(cb, 300);

const cancelIdle: (id: number) => void =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window ? (id) => window.cancelIdleCallback(id) : (id) => window.clearTimeout(id);

/**
 * Pulls images into the HTTP cache while the browser is otherwise idle, so the
 * screen that needs them paints from cache instead of from the network.
 *
 * Deliberately fire-and-forget: nothing is held after load, so 30 thumbnails
 * cost cache space rather than 30 live decoded bitmaps. For art that must
 * paint the instant it mounts, use `useWarmImage` — it keeps the decode too.
 */
export function usePrefetchImages(urls: string[], { enabled = true, concurrency = 4 }: { enabled?: boolean; concurrency?: number } = {}) {
  // urls is a fresh array most renders; the join keeps the effect stable.
  const key = urls.join(',');

  useEffect(() => {
    if (!enabled || shouldSkip()) return;

    const pending = key ? key.split(',').filter((u) => !requested.has(u)) : [];
    if (!pending.length) return;

    let cancelled = false;
    const inFlight = new Map<string, HTMLImageElement>();

    const next = () => {
      if (cancelled) return;
      const url = pending.shift();
      if (!url) return;
      requested.add(url);
      const img = new Image();
      inFlight.set(url, img);
      img.onload = img.onerror = () => {
        inFlight.delete(url);
        if (!cancelled) next();
      };
      img.src = url;
    };

    const id = onIdle(() => {
      for (let i = 0; i < concurrency; i++) next();
    });

    return () => {
      cancelled = true;
      cancelIdle(id);
      for (const [url, img] of inFlight) {
        // Detaching src lets the browser abandon the request; since these
        // never landed, un-mark them so a later mount can try again.
        img.src = '';
        requested.delete(url);
      }
    };
  }, [key, enabled, concurrency]);
}
