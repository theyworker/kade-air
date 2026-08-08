'use client';

import { useRef, useState } from 'react';

type Props = { onEnded: () => void };

// How far into the screen the window may be dragged, in px. The top and
// bottom keep-outs clear the stepper and the status card; the sides are just
// a margin, so the frame never kisses the bezel.
const EDGE = 8;
const TOP = 48;
const BOTTOM = 150;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

// Picture-in-picture feed that runs for the whole flight and can be dragged
// out of the way. The clip is shorter than the delivery, so it reaches its
// own end mid-descent and the parent retires it.
export default function LiveCam({ onEnded }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const parent = el.offsetParent ?? el.parentElement;
    if (!parent) return;

    // The bounds are resolved once, from where the window sits right now, so
    // the pointer can wander past them and come back without the frame
    // drifting away from the cursor.
    const pr = parent.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const { x: x0, y: y0 } = pos;
    const minX = x0 - (er.left - pr.left - EDGE);
    const maxX = x0 + (pr.right - EDGE - er.right);
    const minY = y0 - (er.top - pr.top - TOP);
    const maxY = y0 + (pr.bottom - BOTTOM - er.bottom);
    const sx = e.clientX;
    const sy = e.clientY;

    setDragging(true);
    const move = (ev: PointerEvent) =>
      setPos({ x: clamp(x0 + ev.clientX - sx, minX, maxX), y: clamp(y0 + ev.clientY - sy, minY, maxY) });
    const end = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  return (
    <div
      onPointerDown={startDrag}
      style={{
        position: 'absolute',
        left: 14,
        bottom: 158,
        zIndex: 33,
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      }}
    >
      <div style={{ width: 158, background: '#372a54', border: '3px solid #372a54', borderRadius: 16, boxShadow: '0 5px 0 rgba(55,42,84,.45)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 112, background: '#241a3a' }}>
          <video
            ref={videoRef}
            src="/cam/drone-cam.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            // Autoplay is muted + inline so every mobile browser allows it,
            // but it can still be refused outright; nudge it once so the
            // window is never a frozen first frame.
            onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
            onEnded={onEnded}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
          />
          <div style={{ position: 'absolute', top: 7, left: 7, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(55,42,84,.82)', borderRadius: 999, padding: '3px 8px 3px 6px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
            <div style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: '#fff' }}>LIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
