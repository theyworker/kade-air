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
// distributed, so the two big ones sit above the rotors and the small ones tuck
// into the corners — which is why desktop carries its own set instead of
// scaling the phone's.
const QUESTIONS = {
  phone: [
    { top: -2, left: 6, size: 15, color: '#8a7ba8', dur: 2.1, delay: 0 },
    { top: -12, left: 24, size: 20, color: '#6d5f8e', dur: 2.6, delay: 0.3 },
    { top: -11, right: 24, size: 18, color: '#8a7ba8', dur: 2.3, delay: 0.15 },
    { top: -1, right: 6, size: 13, color: '#a394c2', dur: 2.9, delay: 0.45 },
  ],
  desktop: [
    { top: -2, left: 10, size: 19, color: '#8a7ba8', dur: 2.1, delay: 0 },
    { top: -16, left: 34, size: 26, color: '#6d5f8e', dur: 2.6, delay: 0.3 },
    { top: -14, right: 34, size: 23, color: '#8a7ba8', dur: 2.3, delay: 0.15 },
    { top: -1, right: 10, size: 17, color: '#a394c2', dur: 2.9, delay: 0.45 },
  ],
};

// Both design files spec this dialog, and not as one scaled by a factor — the
// desktop card is roomier, the pills sit in a row rather than a stack. Carrying
// both sets verbatim beats deriving one from the other and drifting.
const SPEC = {
  phone: {
    overlayPad: 26,
    maxWidth: 290,
    radius: 22,
    shadow: '0 8px 0 #372a54',
    padding: '20px 18px 18px',
    gap: 12,
    dronePad: '14px 0 4px',
    droneScale: 132 / 74, // DroneMark's natural width is 74
    badge: 30,
    badgeFont: 17,
    headGap: 10,
    titleFont: 19,
    leadFont: 13,
    pillDirection: 'column' as const,
    pillGap: 7,
    pillPad: '7px 12px',
    pillFont: 12.5,
    ctaBorder: '2.5px solid #372a54',
    ctaRadius: 14,
    ctaLift: '4px',
    ctaPad: 12,
    ctaFont: 16,
  },
  desktop: {
    overlayPad: 40,
    maxWidth: 420,
    radius: 26,
    shadow: '0 10px 0 #372a54',
    padding: '26px 26px 24px',
    gap: 15,
    dronePad: '16px 0 4px',
    droneScale: 168 / 74,
    badge: 36,
    badgeFont: 20,
    headGap: 12,
    titleFont: 24,
    leadFont: 15,
    pillDirection: 'row' as const,
    pillGap: 9,
    pillPad: '8px 15px',
    pillFont: 14,
    ctaBorder: '3px solid #372a54',
    ctaRadius: 16,
    ctaLift: '5px',
    ctaPad: 14,
    ctaFont: 18,
  },
};

/**
 * What happens when you hit "Release the drone" with the form half-filled: a
 * confused drone, and the empty fields read back to you by name.
 */
export default function RequiredDialog({ missing, onDismiss, variant = 'phone' }: Props) {
  const s = SPEC[variant];
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
        position: variant === 'desktop' ? 'fixed' : 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(55,42,84,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: s.overlayPad,
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
          maxWidth: s.maxWidth,
          background: '#fff',
          border: '3px solid #372a54',
          borderRadius: s.radius,
          boxShadow: s.shadow,
          padding: s.padding,
          display: 'flex',
          flexDirection: 'column',
          gap: s.gap,
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: s.dronePad }}>
          <div style={{ position: 'relative' }}>
            {QUESTIONS[variant].map((q, i) => (
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
            <DroneMark scale={s.droneScale} parcel={false} tilt={0} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: s.headGap }}>
          <div
            aria-hidden
            className="fredoka"
            style={{
              width: s.badge,
              height: s.badge,
              flex: 'none',
              borderRadius: '50%',
              background: '#d93a2b',
              border: '2.5px solid #372a54',
              color: '#fff',
              fontWeight: 600,
              fontSize: s.badgeFont,
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
            style={{ fontWeight: 600, fontSize: s.titleFont, color: '#372a54', lineHeight: 1.1 }}
          >
            Drone can&apos;t take off
          </div>
        </div>

        <div style={{ fontSize: s.leadFont, fontWeight: 700, color: '#6d5f8e', lineHeight: 1.4 }}>
          These bits are still empty:
        </div>

        <div style={{ display: 'flex', flexDirection: s.pillDirection, flexWrap: 'wrap', gap: s.pillGap }}>
          {missing.map((label) => (
            <div
              key={label}
              style={{
                background: '#ffe4e0',
                border: '2px solid #d93a2b',
                borderRadius: 999,
                padding: s.pillPad,
                fontSize: s.pillFont,
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
            border: s.ctaBorder,
            borderRadius: s.ctaRadius,
            padding: s.ctaPad,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: s.ctaFont,
            color: '#fff',
            ['--lift' as string]: s.ctaLift,
            ['--drop' as string]: s.ctaLift,
          }}
        >
          Got it
        </div>
      </div>
    </div>
  );
}
