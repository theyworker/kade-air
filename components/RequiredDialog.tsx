'use client';

import { useEffect, useRef } from 'react';
import DroneMark from './DroneMark';

type Props = {
  /** Labels of the fields that are still empty, in form order. */
  missing: string[];
  onDismiss: () => void;
  /** Phone pins the overlay inside the shell; desktop covers the viewport. */
  variant?: 'phone' | 'desktop';
};

// The question marks the drone is hovering under. Hand-placed rather than
// distributed, so the two big ones sit above the rotors and the small ones
// tuck into the corners.
const QUESTIONS = [
  { top: -2, left: 6, size: 15, color: '#8a7ba8', dur: 2.1, delay: 0 },
  { top: -12, left: 24, size: 20, color: '#6d5f8e', dur: 2.6, delay: 0.3 },
  { top: -11, right: 24, size: 18, color: '#8a7ba8', dur: 2.3, delay: 0.15 },
  { top: -1, right: 6, size: 13, color: '#a394c2', dur: 2.9, delay: 0.45 },
];

/**
 * What happens when you hit "Release the drone" with the form half-filled: a
 * confused drone, and the empty fields read back to you by name.
 */
export default function RequiredDialog({ missing, onDismiss, variant = 'phone' }: Props) {
  const d = variant === 'desktop';
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus the card, not the button: it moves the screen reader and the Escape
    // key onto the dialog without painting a focus ring over the design.
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: d ? 'fixed' : 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(55,42,84,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        animation: 'fadeUp .18s ease',
      }}
    >
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="required-dialog-title"
        tabIndex={-1}
        // A tap on the card itself is not a tap on the backdrop — only the
        // backdrop and "Got it" close this.
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: d ? 380 : 290,
          background: '#fff',
          border: '3px solid #372a54',
          borderRadius: 22,
          boxShadow: '0 8px 0 #372a54',
          padding: d ? '26px 24px 24px' : '20px 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ position: 'relative' }}>
            {QUESTIONS.map((q, i) => (
              <div
                key={i}
                aria-hidden
                className="fredoka"
                style={{
                  position: 'absolute',
                  top: q.top,
                  left: q.left,
                  right: q.right,
                  fontWeight: 600,
                  fontSize: q.size,
                  color: q.color,
                  animation: `bob ${q.dur}s ${q.delay}s ease-in-out infinite`,
                }}
              >
                ?
              </div>
            ))}
            <DroneMark scale={d ? 2.4 : 1.8} parcel={false} tilt={0} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden
            className="fredoka"
            style={{
              width: 30,
              height: 30,
              flex: 'none',
              borderRadius: '50%',
              background: '#d93a2b',
              border: '2.5px solid #372a54',
              color: '#fff',
              fontWeight: 600,
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            !
          </div>
          <div
            id="required-dialog-title"
            className="fredoka"
            style={{ fontWeight: 600, fontSize: d ? 23 : 19, color: '#372a54', lineHeight: 1.1 }}
          >
            Drone can&apos;t take off
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#6d5f8e', lineHeight: 1.4 }}>These bits are still empty:</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {missing.map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffe4e0',
                border: '2px solid #d93a2b',
                borderRadius: 999,
                padding: '7px 12px',
                fontSize: 12.5,
                fontWeight: 800,
                color: '#a92a1e',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onDismiss}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onDismiss();
          }}
          className="press fredoka"
          style={{
            marginTop: 4,
            background: '#17a398',
            border: '2.5px solid #372a54',
            borderRadius: 14,
            padding: 12,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 16,
            color: '#fff',
            ['--lift' as string]: '4px',
            ['--drop' as string]: '4px',
          }}
        >
          Got it
        </div>
      </div>
    </div>
  );
}
