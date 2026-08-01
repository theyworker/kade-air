// An order is a row in Postgres, addressed by a short share code. This module
// owns the shape of an order and the rules for cleaning one — it deliberately
// knows nothing about storage.

import { DEFAULT_MESSAGE } from './messages';
import { DISHES } from './dishes';

export type Order = {
  dishId: string;
  sender: string;
  recipient: string;
  message: string;
  chain: number; // sender's position in the food chain (1 = started it)
};

export const MAX_NAME = 24;
export const MAX_MESSAGE = 140;

export const clean = (s: string, max: number) =>
  s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const clampChain = (n: number) => Math.min(9999, Math.max(1, Math.round(n) || 1));

// The validation gate on everything entering the database. Applied on write,
// and again on read, because a row written by an older version of this code is
// input we did not validate under today's rules.
export function sanitizeOrder(input: Order): Order {
  return {
    // A Server Action's TypeScript signature is erased at runtime, so dishId
    // is attacker-controlled input. Anything not a real dish id falls back to
    // the default rather than being stored — this also caps its length,
    // since DISHES.some() rejects anything oversized outright.
    dishId: DISHES.some((d) => d.id === input.dishId) ? input.dishId : DISHES[0].id,
    sender: clean(input.sender ?? '', MAX_NAME),
    recipient: clean(input.recipient ?? '', MAX_NAME),
    message: clean(input.message ?? '', MAX_MESSAGE),
    chain: clampChain(Number(input.chain)),
  };
}

export const senderDisplay = (o: Pick<Order, 'sender'>) => o.sender.trim() || 'a secret machan';
export const recipientDisplay = (o: Pick<Order, 'recipient'>) => o.recipient.trim() || 'your machan';
export const messageDisplay = (o: Pick<Order, 'message'>) => o.message.trim() || DEFAULT_MESSAGE;
