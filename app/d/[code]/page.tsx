import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { preload } from 'react-dom';
import RecipientView from '@/components/RecipientView';
import BrokenLink from '@/components/BrokenLink';
import { findDish } from '@/lib/dishes';
import { getOrder } from '@/lib/orders';
import { senderDisplay } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';
import { isDesktopUA } from '@/lib/ua';

type Props = { params: Promise<{ code: string }> };

// generateMetadata and the page component both need the order, and both run in
// one render pass. React's cache() collapses that into a single lookup.
const loadOrder = cache(getOrder);

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

  // Checked before the lookup, so a client grinding through codes stops costing
  // database reads. Over-quota gets the same screen a dead code gets — there is
  // nothing to gain by confirming to a guesser that they were throttled.
  if (!(await mayRead(clientIp(h)))) return <BrokenLink />;

  // A missing order and an unreachable database are different problems and get
  // different screens: BrokenLink says "this link is dead", which would be a lie
  // during an outage. Let a thrown error reach app/error.tsx instead.
  const order = await loadOrder(code);
  if (!order) return <BrokenLink />;

  const dish = findDish(order.dishId);
  preload(dish.low, { as: 'image', fetchPriority: 'high' });
  preload(dish.high, { as: 'image', fetchPriority: 'low' });

  return <RecipientView order={order} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
