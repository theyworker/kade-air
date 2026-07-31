'use client';

import { useEffect, useRef } from 'react';
import { MESSAGES } from '@/lib/messages';

type Props = {
  message: string;
  onPick: (v: string) => void;
  /** height of the scroll window — px, or any CSS length */
  height: number | string;
  /**
   * Phone pills go solid teal when picked and toggle off on a second tap;
   * the desktop design keeps them cream with a mint fill and no toggle.
   */
  variant?: 'phone' | 'desktop';
};

// The deck is longer than the screen, so it creeps upward on its own to
// advertise that there's more below. The moment someone scrolls it themselves
// the creep stops for good — it used to resume and wrap back to the top, which
// made the last few messages impossible to hold on to.
export default function MessagePicker({ message, onPick, height, variant = 'phone' }: Props) {
  const desktop = variant === 'desktop';
  const ref = useRef<HTMLDivElement>(null);
  const surrendered = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const el = ref.current;
      if (!el || surrendered.current) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 1) return;
      el.scrollTop = el.scrollTop >= max - 0.5 ? 0 : el.scrollTop + 0.5;
    }, 24);
    return () => clearInterval(id);
  }, []);

  const surrender = () => {
    surrendered.current = true;
  };

  const mask = 'linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 26px), transparent 100%)';

  return (
    <div
      ref={ref}
      onPointerEnter={surrender}
      onPointerDown={surrender}
      onWheel={surrender}
      onTouchStart={surrender}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: desktop ? 9 : 8,
        marginTop: desktop ? 4 : 2,
        padding: '6px 2px 10px',
        height,
        flex: 'none',
        overflowY: 'auto',
        alignContent: 'flex-start',
        // `contain` used to trap the page: on a short phone this box covers most
        // of the scrollable area, so a finger landing on it could never reach
        // the fields below. Chaining to the page once the deck ends is the way out.
        overscrollBehavior: 'auto',
        scrollbarWidth: 'none',
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      {MESSAGES.map((t) => {
        const on = message === t;
        return (
          <div
            key={t}
            onClick={() => onPick(desktop || !on ? t : '')}
            className="press"
            style={{
              background: on ? (desktop ? '#c8f0d8' : '#17a398') : desktop ? '#fdf6ea' : '#fff',
              color: on && !desktop ? '#fff' : '#372a54',
              border: '2px solid #372a54',
              borderRadius: 999,
              padding: desktop ? '8px 14px' : '7px 12px',
              fontSize: desktop ? 13 : 12,
              fontWeight: 700,
              lineHeight: desktop ? 1.5 : 1.2,
              whiteSpace: desktop ? 'nowrap' : undefined,
              transition: 'background .15s ease',
              ['--lift' as string]: '2px',
              ['--drop' as string]: '2px',
              ['--rest' as string]: '0',
            }}
          >
            {on && !desktop ? `✓ ${t}` : t}
          </div>
        );
      })}
    </div>
  );
}
