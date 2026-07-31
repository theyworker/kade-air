'use client';

import { useEffect, useMemo, useState } from 'react';
import { findDish } from '@/lib/dishes';
import { encodeOrder, messageDisplay, recipientDisplay, senderDisplay } from '@/lib/order';
import { useIsDesktop } from '@/lib/useIsDesktop';
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
  const order = { dishId, sender, recipient, message, chain };
  const token = useMemo(() => encodeOrder(order), [dishId, sender, recipient, message, chain]); // eslint-disable-line react-hooks/exhaustive-deps
  const link = `${origin || 'https://kade.air'}/d/${token}`;

  const shared = {
    onSelect: (id: string) => {
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
          onBack={() => setScreen('menu')}
          onSubmit={() => setScreen('share')}
        />
      );
      break;
    }
    case 'share': {
      const S = desktop ? ShareD : Share;
      content = (
        <S
          dish={dish}
          senderDisplay={senderDisplay(order)}
          recipientDisplay={recipientDisplay(order)}
          link={link}
          onBack={() => setScreen('personalise')}
          onPreview={shared.onPreview}
        />
      );
      break;
    }
    case 'track': {
      content = desktop ? (
        <TrackScreenD key={trackKey} dish={dish} onExit={() => setScreen('share')} onLoop={() => setScreen('loop')} />
      ) : (
        <TrackScreen
          key={trackKey}
          dish={dish}
          senderDisplay={senderDisplay(order)}
          recipientDisplay={recipientDisplay(order)}
          msgDisplay={messageDisplay(order)}
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
          dish={dish}
          senderDisplay={senderDisplay(order)}
          recipientDisplay={recipientDisplay(order)}
          msgDisplay={messageDisplay(order)}
          onSendAgain={() => setScreen('menu')}
          onReplay={shared.onReplay}
        />
      ) : (
        <Loop
          dish={dish}
          senderDisplay={senderDisplay(order)}
          recipientDisplay={recipientDisplay(order)}
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
