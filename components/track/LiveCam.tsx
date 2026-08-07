'use client';

import { useRef, useState } from 'react';

type Props = {
  // true once the drone has left the kitchen, which relabels the feed
  airborne: boolean;
  onEnded: () => void;
};

// Hold-to-peek feed pinned above the status card. The clip plays from mount
// whether or not anyone is watching — that's what sells it as live — and the
// parent retires the whole widget when it runs out.
export default function LiveCam({ airborne, onEnded }: Props) {
  const [holding, setHolding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay is muted + inline so every mobile browser allows it, but it can
  // still be blocked outright, and browsers pause a muted video once it's
  // invisible — which this one is between peeks. Nudging it on every hold
  // covers both, so the feed is never a frozen frame when someone looks.
  const kick = () => videoRef.current?.play().catch(() => {});

  const hold = () => {
    setHolding(true);
    kick();
  };

  return (
    <div style={{ position: 'absolute', right: 14, bottom: 158, zIndex: 33, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: '100%',
          marginBottom: 8,
          opacity: holding ? 1 : 0,
          transform: `scale(${holding ? 1 : 0.9})`,
          transformOrigin: '100% 100%',
          transition: 'opacity .16s ease, transform .18s cubic-bezier(.2,1.4,.5,1)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: 186, background: '#372a54', border: '3px solid #372a54', borderRadius: 18, boxShadow: '0 6px 0 rgba(55,42,84,.45)', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: 132, background: '#241a3a' }}>
            <video
              ref={videoRef}
              src="/cam/drone-cam.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={kick}
              onEnded={onEnded}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', top: 7, left: 7, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(55,42,84,.82)', borderRadius: 999, padding: '3px 8px 3px 6px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
              <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: '#fff' }}>LIVE</div>
            </div>
          </div>
        </div>
      </div>

      <div
        onPointerDown={hold}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onContextMenu={(e) => e.preventDefault()}
        className={`press livecam-btn${holding ? ' held' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '3px solid #372a54',
          borderRadius: 999,
          padding: '11px 16px',
          touchAction: 'none',
          animation: 'bob 2.6s ease-in-out infinite',
          ['--lift' as string]: '5px',
          ['--drop' as string]: '5px',
          ['--rest' as string]: '0px',
        }}
      >
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
        <div className="fredoka" style={{ fontWeight: 600, fontSize: 14.5, color: '#372a54', whiteSpace: 'nowrap' }}>
          {airborne ? 'Drone cam' : 'Kitchen cam'}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#372a54', background: '#fff', border: '2px solid #372a54', borderRadius: 999, padding: '2px 7px' }}>
          hold
        </div>
      </div>
    </div>
  );
}
