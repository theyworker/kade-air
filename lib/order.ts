// An order is fully encoded in its share link token — no database needed.
// The token is base64url(JSON) so the server can render OG tags and the
// OG image for any link without a lookup.

import { DEFAULT_MESSAGE } from './messages';

export type Order = {
  dishId: string;
  sender: string;
  recipient: string;
  message: string;
  chain: number; // sender's position in the food chain (1 = started it)
};

export const MAX_NAME = 24;
export const MAX_MESSAGE = 140;

const clean = (s: string, max: number) =>
  s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeOrder(order: Order): string {
  const payload = {
    d: order.dishId,
    s: clean(order.sender, MAX_NAME),
    r: clean(order.recipient, MAX_NAME),
    m: clean(order.message, MAX_MESSAGE),
    c: Math.min(9999, Math.max(1, Math.round(order.chain) || 1)),
  };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeOrder(token: string): Order | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(fromBase64Url(token)));
    if (typeof raw !== 'object' || raw === null || typeof raw.d !== 'string') return null;
    return {
      dishId: raw.d,
      sender: clean(String(raw.s ?? ''), MAX_NAME),
      recipient: clean(String(raw.r ?? ''), MAX_NAME),
      message: clean(String(raw.m ?? ''), MAX_MESSAGE),
      chain: Math.min(9999, Math.max(1, Math.round(Number(raw.c)) || 1)),
    };
  } catch {
    return null;
  }
}

export const senderDisplay = (o: Pick<Order, 'sender'>) => o.sender.trim() || 'a secret machan';
export const recipientDisplay = (o: Pick<Order, 'recipient'>) => o.recipient.trim() || 'your machan';
export const messageDisplay = (o: Pick<Order, 'message'>) => o.message.trim() || DEFAULT_MESSAGE;
