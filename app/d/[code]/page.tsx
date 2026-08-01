import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { preload } from 'react-dom';
import RecipientView from '@/components/RecipientView';
import BrokenLink from '@/components/BrokenLink';
import { findDish } from '@/lib/dishes';
import { getOrder } from '@/lib/orders';
import type { Order } from '@/lib/order';
import { senderDisplay } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';
import { isDesktopUA } from '@/lib/ua';

type Props = { params: Promise<{ code: string }> };

/**
 * True when this client may proceed.
 *
 * Short codes are only as safe as the ceiling on guessing them, so the read
 * path is limited as well as creation. Fails OPEN: if Redis is unreachable we
 * serve the delivery rather than punish a recipient for our outage.
 */
async function mayRead(ip: string): Promise<boolean> {
  try {
    const { success } = await readLimiter().limit(ip);
    return success;
  } catch (err) {
    console.error('[kade-air] read limiter unavailable, allowing request', err);
    return true;
  }
}

/**
 * The one door to an order for this request.
 *
 * The limiter check lives inside the cached loader rather than in the page
 * component, because generateMetadata also loads the order and runs in the
 * same pass — a check in only one of them would let the other pay for the
 * database read anyway. cache() means one limiter call and one lookup per
 * render, shared by both.
 *
 * Over-quota returns null, which is deliberately the same answer a dead code
 * gives: the recipient sees BrokenLink, a crawler sees the stale-link title,
 * and a guesser learns nothing about whether the code was real.
 */
const loadOrder = cache(async (code: string): Promise<Order | null> => {
  const h = await headers();
  if (!(await mayRead(clientIp(h)))) return null;
  return getOrder(code);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const order = await loadOrder(code).catch(() => null);

  if (!order) {
    return { title: 'Kade Air — this link went stale', robots: { index: false, follow: false } };
  }

  const dish = findDish(order.dishId);
  const title = `${dish.emoji} ${senderDisplay(order)} sent you ${dish.name}!`;
  const description = 'Your delivery is on the way. Tap to watch the drone fly it over Colombo.';

  return {
    title,
    description,
    // Titles carry real names ("Devaka sent you Kottu!"). Never index these —
    // robots.txt intentionally permits the fetch so previews still render.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', url: `/d/${code}`, siteName: 'Kade Air' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function DeliveryPage({ params }: Props) {
  const [{ code }, h] = await Promise.all([params, headers()]);

  // A missing order, an over-quota request, and an unreachable database are not
  // the same thing, but only two of them get the same screen. loadOrder folds
  // "no such order" and "over quota" into the same null — both are BrokenLink,
  // and there is nothing to gain by telling a guesser which one they hit. An
  // unreachable database is different: that is a lie BrokenLink must not tell,
  // so a thrown error is left uncaught here and reaches app/error.tsx instead.
  const order = await loadOrder(code);
  if (!order) return <BrokenLink />;

  const dish = findDish(order.dishId);
  preload(dish.low, { as: 'image', fetchPriority: 'high' });
  preload(dish.high, { as: 'image', fetchPriority: 'low' });

  return <RecipientView order={order} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
