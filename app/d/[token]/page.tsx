import type { Metadata } from 'next';
import { headers } from 'next/headers';
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
    return { title: 'Kade Air — this link went stale' };
  }
  const dish = findDish(order.dishId);
  const title = `${dish.emoji} ${senderDisplay(order)} sent you ${dish.name}!`;
  const description = 'Your delivery is on the way. Tap to watch the drone fly it over Colombo.';
  return {
    title,
    description,
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
  return <RecipientView order={order} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
