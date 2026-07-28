'use client';

import { useEffect, useRef, useState } from 'react';

// Fetches AND decodes an image ahead of time, holding on to the element so
// the browser keeps the decoded bitmap alive. Used to warm the delivery
// reveal art while the drone is still flying: preloading alone only starts
// the download, leaving a full-size decode to happen on first paint.
// Returns true once the image is decoded and safe to render instantly.
export function useWarmImage(src: string): boolean {
  const held = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    const img = new Image();
    held.current = img; // keep a reference so the decoded bitmap isn't dropped
    img.src = src;

    const done = () => {
      if (!cancelled) setReady(true);
    };
    if (img.decode) {
      img.decode().then(done, done); // resolve either way — a failed decode still falls back
    } else {
      img.onload = done;
      img.onerror = done;
    }

    return () => {
      cancelled = true;
    };
  }, [src]);

  return ready;
}
