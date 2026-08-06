'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { findDish } from '@/lib/dishes';
import { Order, messageDisplay, recipientDisplay, senderDisplay } from '@/lib/order';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { rememberSenderName } from '@/lib/senderName';
import { TOP_COLOR, TOP_COLOR_DESKTOP, useThemeColor } from '@/lib/useThemeColor';
import PhoneShell from '@/components/PhoneShell';
import Loop from '@/components/screens/Loop';
import TrackScreen from '@/components/track/TrackScreen';
import LoopD from '@/components/desktop/LoopD';
import TrackScreenD from '@/components/desktop/TrackScreenD';

type Props = { order: Order; initialDesktop?: boolean };

// What the recipient sees when they open a share link: the delivery
// plays immediately, then the loop end card nudges them to pass it on.
export default function RecipientView({ order, initialDesktop = false }: Props) {
  const desktop = useIsDesktop(initialDesktop);
  const router = useRouter();
  const [screen, setScreen] = useState<'track' | 'loop'>('track');
  const [trackKey, setTrackKey] = useState(0);
  const dish = findDish(order.dishId);

  // Keep the mobile browser chrome on the colour this screen paints at the top.
  useThemeColor(desktop ? TOP_COLOR_DESKTOP[screen] : TOP_COLOR[screen], !desktop);

  const onSendAgain = () => {
    // Passing it on makes this recipient the next sender. Carry the name they
    // were addressed by so the create flow signs their order for them.
    rememberSenderName(order.recipient);
    router.push(`/?chain=${order.chain + 1}`);
  };
  const onReplay = () => {
    setTrackKey((k) => k + 1);
    setScreen('track');
  };

  let content: React.ReactNode;
  if (screen === 'loop') {
    // Desktop skips the reveal card, so the note rides on the end card instead.
    content = desktop ? (
      <LoopD
        dish={dish}
        senderDisplay={senderDisplay(order)}
        recipientDisplay={recipientDisplay(order)}
        msgDisplay={messageDisplay(order)}
        onSendAgain={onSendAgain}
        onReplay={onReplay}
      />
    ) : (
      <Loop
        dish={dish}
        senderDisplay={senderDisplay(order)}
        recipientDisplay={recipientDisplay(order)}
        onSendAgain={onSendAgain}
        onReplay={onReplay}
      />
    );
  } else {
    content = desktop ? (
      <TrackScreenD key={trackKey} dish={dish} onLoop={() => setScreen('loop')} />
    ) : (
      <TrackScreen
        key={trackKey}
        dish={dish}
        senderDisplay={senderDisplay(order)}
        recipientDisplay={recipientDisplay(order)}
        msgDisplay={messageDisplay(order)}
        onLoop={() => setScreen('loop')}
      />
    );
  }

  if (desktop) {
    return <div style={{ minHeight: '100vh', width: '100%', background: '#fdf6ea', color: '#372a54' }}>{content}</div>;
  }
  return <PhoneShell>{content}</PhoneShell>;
}
