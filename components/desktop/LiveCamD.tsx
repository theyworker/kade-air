'use client';

import { useRef } from 'react';

type Props = { onEnded: () => void };

// The desktop feed is parked in the bottom-left corner rather than draggable —
// there is room for it there, so nothing has to move out of its way.
export default function LiveCamD({ onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div style={{ position: 'absolute', left: 20, bottom: 20, zIndex: 33, pointerEvents: 'none' }}>
      <div style={{ width: 212, background: '#372a54', border: '3px solid #372a54', borderRadius: 18, boxShadow: '0 5px 0 rgba(55,42,84,.45)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 150, background: '#241a3a' }}>
          <video
            ref={videoRef}
            src="/cam/drone-cam.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
            onEnded={onEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: 9, left: 9, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(55,42,84,.82)', borderRadius: 999, padding: '4px 10px 4px 7px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
            <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: '#fff' }}>LIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
