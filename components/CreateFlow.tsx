'use client';

import { useEffect, useRef, useState } from 'react';
import { preload } from 'react-dom';
import { MENU_ART, findDish } from '@/lib/dishes';
import type { Order } from '@/lib/order';
import { messageDisplay, recipientDisplay, senderDisplay } from '@/lib/order';
import { createOrderAction } from '@/app/actions';
import type { CreateOrderResult } from '@/app/actions';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { usePrefetchImages } from '@/lib/usePrefetchImages';
import PhoneShell from '@/components/PhoneShell';
import Landing from '@/components/screens/Landing';
import Menu from '@/components/screens/Menu';
import Personalise from '@/components/screens/Personalise';
import Share from '@/components/screens/Share';
import Loop from '@/components/screens/Loop';
import TrackScreen from '@/components/track/TrackScreen';
import LandingD from '@/components/desktop/LandingD';
import MenuD from '@/components/desktop/MenuD';
import PersonaliseD from '@/components/desktop/PersonaliseD';
import ShareD from '@/components/desktop/ShareD';
import LoopD from '@/components/desktop/LoopD';
import TrackScreenD from '@/components/desktop/TrackScreenD';

type Screen = 'home' | 'menu' | 'personalise' | 'share' | 'track' | 'loop';

type Props = { chain?: number; initialDesktop?: boolean };

export default function CreateFlow({ chain = 1, initialDesktop = false }: Props) {
  const desktop = useIsDesktop(initialDesktop);
  const [screen, setScreen] = useState<Screen>('home');
  const [dishId, setDishId] = useState('kottu');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [trackKey, setTrackKey] = useState(0);
  const [origin, setOrigin] = useState('');

  useEffect(() => setOrigin(window.location.origin), []);

  const dish = findDish(dishId);

  // Warm the whole grid while the landing screen is still being read, so the
  // menu paints from cache instead of loading 30 thumbnails in front of you.
  usePrefetchImages(MENU_ART, { enabled: screen === 'home' });

  const order = { dishId, sender, recipient, message, chain };

  // What the link actually points at. Frozen when the order is accepted, because
  // the fields stay editable while the request is in flight — reading live state
  // on these screens would let the Share card describe a different order than the
  // code resolves to.
  const [placed, setPlaced] = useState<{ code: string; order: Order } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<'rate_limited' | 'failed' | null>(null);

  const link = placed ? `${origin || 'https://kade.air'}/d/${placed.code}` : '';

  // Screens after submission describe the placed order; screens before it
  // describe what is currently being composed.
  const shown = placed?.order ?? order;
  const shownDish = findDish(shown.dishId);

  // Once a dish is picked the reveal art is inevitable — start it now rather
  // than waiting for the flight to mount and race it. Post-submission screens
  // render shownDish, not the live dish, so that is what must be preloaded.
  if (screen !== 'home' && screen !== 'menu') preload(shownDish.high, { as: 'image' });

  // Guards against a double-click racing two submitOrder calls: React state
  // updates asynchronously, so two clicks milliseconds apart can both observe
  // `submitting === false` before either setSubmitting(true) commits. A ref is
  // read and set synchronously, closing that window.
  const submittingRef = useRef(false);

  const submitOrder = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    let result: CreateOrderResult;
    try {
      result = await createOrderAction(order);
    } catch (err) {
      // A rejected action call is the network dropping, not the order being
      // refused — the button must come back either way.
      console.error('[kade-air] order action failed', err);
      result = { ok: false, reason: 'failed' };
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }

    if (result.ok) {
      setPlaced({ code: result.code, order });
      setScreen('share');
      return;
    }
    setSubmitError(result.reason);
  };

  const shared = {
    onSelect: (id: string) => {
      setSubmitError(null);
      setDishId(id);
      setScreen('personalise');
    },
    onPreview: () => {
      setTrackKey((k) => k + 1);
      setScreen('track');
    },
    onReplay: () => {
      setTrackKey((k) => k + 1);
      setScreen('track');
    },
  };

  let content: React.ReactNode;
  switch (screen) {
    case 'home': {
      const L = desktop ? LandingD : Landing;
      content = <L onStart={() => setScreen('menu')} />;
      break;
    }
    case 'menu': {
      const M = desktop ? MenuD : Menu;
      content = <M onBack={() => setScreen('home')} onSelect={shared.onSelect} />;
      break;
    }
    case 'personalise': {
      const P = desktop ? PersonaliseD : Personalise;
      content = (
        <P
          dish={dish}
          sender={sender}
          recipient={recipient}
          message={message}
          onSender={setSender}
          onRecipient={setRecipient}
          onMessage={setMessage}
          onBack={() => {
            setSubmitError(null);
            setScreen('menu');
          }}
          onSubmit={submitOrder}
          submitting={submitting}
          submitError={submitError}
        />
      );
      break;
    }
    case 'share': {
      const S = desktop ? ShareD : Share;
      content = (
        <S
          dish={shownDish}
          senderDisplay={senderDisplay(shown)}
          recipientDisplay={recipientDisplay(shown)}
          link={link}
          onBack={() => setScreen('personalise')}
          onPreview={shared.onPreview}
        />
      );
      break;
    }
    case 'track': {
      content = desktop ? (
        <TrackScreenD key={trackKey} dish={shownDish} onExit={() => setScreen('share')} onLoop={() => setScreen('loop')} />
      ) : (
        <TrackScreen
          key={trackKey}
          dish={shownDish}
          senderDisplay={senderDisplay(shown)}
          recipientDisplay={recipientDisplay(shown)}
          msgDisplay={messageDisplay(shown)}
          onExit={() => setScreen('share')}
          onLoop={() => setScreen('loop')}
        />
      );
      break;
    }
    case 'loop': {
      // Desktop skips the reveal card, so the note rides on the end card instead.
      content = desktop ? (
        <LoopD
          dish={shownDish}
          senderDisplay={senderDisplay(shown)}
          recipientDisplay={recipientDisplay(shown)}
          msgDisplay={messageDisplay(shown)}
          onSendAgain={() => setScreen('menu')}
          onReplay={shared.onReplay}
        />
      ) : (
        <Loop
          dish={shownDish}
          senderDisplay={senderDisplay(shown)}
          recipientDisplay={recipientDisplay(shown)}
          onSendAgain={() => setScreen('menu')}
          onReplay={shared.onReplay}
        />
      );
      break;
    }
  }

  if (desktop) {
    return <div style={{ minHeight: '100vh', width: '100%', background: '#fdf6ea', color: '#372a54' }}>{content}</div>;
  }
  return <PhoneShell>{content}</PhoneShell>;
}
