import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { preload } from 'react-dom';
import RecipientView from '@/components/RecipientView';
import BrokenLink from '@/components/BrokenLink';
import { findDish } from '@/lib/dishes';
import { decodeOrder, senderDisplay } from '@/lib/order';
import { isDesktopUA } from '@/lib/ua';

type Props = { params: Promise<{ token: string }> };

// Chat-app crawlers don't run JS: every link's OG tags must be in the
// server-rendered HTML. The dynamic og:image comes from the sibling
// opengraph-image.tsx via the file convention.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const order = decodeOrder(decodeURIComponent(token));
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
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/d/${token}`,
      siteName: 'Kade Air',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DeliveryPage({ params }: Props) {
  const [{ token }, h] = await Promise.all([params, headers()]);
  const order = decodeOrder(decodeURIComponent(token));
  if (!order) return <BrokenLink />;

  // The token already names the dish, so both renders can start downloading
  // with the document — no waiting on hydration. The flight buys the ~153KB
  // reveal plenty of time; the thumbnail is wanted immediately, hence high.
  const dish = findDish(order.dishId);
  preload(dish.low, { as: 'image', fetchPriority: 'high' });
  preload(dish.high, { as: 'image', fetchPriority: 'low' });

  return <RecipientView order={order} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
