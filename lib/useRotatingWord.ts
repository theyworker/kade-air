'use client';

import { useEffect, useState } from 'react';

/** Who you'd send food to, cycled through the landing headline. */
export const WORDS = [
  'machan',
  'friend',
  'boyfriend',
  'girlfriend',
  'wife',
  'husband',
  'coworker',
  'neighbour',
  'mom',
  'dad',
  'sister',
  'brother',
];

// Both landings run the same cycle, so the list and the timer live here rather
// than once per screen.
export function useRotatingWord(): string {
  // Starts on 'machan' so the server and the first client render agree.
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 1800);
    return () => clearInterval(id);
  }, []);

  return WORDS[i];
}
