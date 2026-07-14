'use client';

import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

// The server guesses from the user agent (initial), then the client
// follows the real viewport. First client render must match the server
// to avoid hydration mismatches, so the swap happens in an effect.
export function useIsDesktop(initial: boolean): boolean {
  const [isDesktop, setIsDesktop] = useState(initial);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
