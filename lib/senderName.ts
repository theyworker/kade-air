'use client';

// Remembers who is doing the sending across visits, in localStorage. The name
// someone signs an order with is almost always the name they'll sign the next
// one with, so we keep it and pre-fill the field on the second order onwards.
// When a recipient passes the food on, the name they were addressed by becomes
// the name they send under — the chain flows through the same slot.

import { clean, MAX_NAME } from './order';

const KEY = 'kade-air:sender-name';

// The stored name, cleaned to the same rules an order name obeys. Returns ''
// when nothing is stored or storage is unavailable (SSR, private mode).
export function readSenderName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return clean(window.localStorage.getItem(KEY) ?? '', MAX_NAME);
  } catch {
    return '';
  }
}

// Persists a name for the next order to pre-fill. A blank name is ignored
// rather than wiping a good one already on record.
export function rememberSenderName(name: string): void {
  if (typeof window === 'undefined') return;
  const value = clean(name, MAX_NAME);
  if (!value) return;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Storage full or blocked — remembering the name is a nicety, not a
    // feature worth throwing over.
  }
}
