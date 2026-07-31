'use client';

import { useEffect } from 'react';
import { preload } from 'react-dom';
import type { Dish } from '@/lib/dishes';
import { DESKTOP_GEOMETRY, STATUS_TEXT } from '@/lib/flight';
import { useDelivery } from '@/lib/useDelivery';
import { useWarmImage } from '@/lib/useWarmImage';
import SpeakerIcon from '../SpeakerIcon';
import KitchenD from './KitchenD';
import SkylineD from './SkylineD';

type Props = {
  dish: Dish;
  onExit?: () => void;
  onLoop: () => void;
  fastMode?: boolean;
  showTuk?: boolean;
};

const STEP_LABELS = ['Accepted', 'Preparing', 'Dispatched', 'Delivered'];

export default function TrackScreenD({ dish, onExit, onLoop, fastMode = false, showTuk = true }: Props) {
  const d = useDelivery(fastMode, DESKTOP_GEOMETRY, true);
  const { phase, world } = d;

  // Desktop has no reveal card of its own — the end card is the reveal. Warm
  // the big art here so it paints the instant the flight hands over.
  preload(dish.high, { as: 'image' });
  useWarmImage(dish.high);

  // Confetti lands, then the scene gives way to the end card (design: +1600ms
  // after delivery, which is 900ms past the `revealed` beat at +700ms).
  useEffect(() => {
    if (!d.revealed) return;
    const id = setTimeout(onLoop, 900);
    return () => clearTimeout(id);
  }, [d.revealed, onLoop]);

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#8ed0f7' }}>
      {/* WORLD: 3 viewports wide, camera pans */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '300%',
          transform: `translateX(-${world.cam.toFixed(2)}%)`,
          background: 'linear-gradient(#6cc4f5 0%, #9ddaf8 34%, #cdeafc 52%, #ffe6b8 64%, #ffd98f 66%, #ffd98f 100%)',
        }}
      >
        {/* sun + clouds */}
        <div style={{ position: 'absolute', top: '8%', left: '56%', width: 130, height: 130, pointerEvents: 'none', zIndex: 1 }}>
          <div
            style={{
              position: 'absolute',
              inset: -30,
              borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(255,209,102,.5) 0 9deg, transparent 9deg 30deg)',
              animation: 'sunSpin 26s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 15,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #ffe59a, #ffc94d)',
              border: '3px solid #372a54',
              boxShadow: '0 0 44px rgba(255,201,77,.8)',
            }}
          />
        </div>
        <div style={{ position: 'absolute', top: '14%', left: '64%', width: 130, height: 38, background: '#fff', borderRadius: 26, border: '3px solid #372a54', zIndex: 1, animation: 'driftD 11s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '23%', left: '80%', width: 92, height: 30, background: '#fff', borderRadius: 26, border: '3px solid #372a54', opacity: 0.92, zIndex: 1, animation: 'driftD 14s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: '9%', left: '40%', width: 104, height: 32, background: '#fff', borderRadius: 26, border: '3px solid #372a54', opacity: 0.95, zIndex: 1, animation: 'driftD 13s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '11%', left: '22%', width: 104, height: 32, background: '#fff', borderRadius: 26, border: '3px solid #372a54', opacity: 0.95, zIndex: 1, animation: 'driftD 15s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: '29%', left: '92%', zIndex: 1, animation: 'floaty 4.5s ease-in-out infinite' }}>
          <div style={{ width: 24, height: 24, background: '#ff6f9c', border: '3px solid #372a54', borderRadius: 4 }} />
        </div>

        <KitchenD
          ticketStamped={d.ticketStamped}
          kitchenBusy={d.kitchenBusy}
          chefHanding={phase === 'dispatched'}
          handoffActive={d.handoffActive}
          handoffDur={d.handoffDur}
        />

        <SkylineD padActive={phase === 'arriving'} landed={phase === 'delivered'} dishIcon={dish.low} dishName={dish.name} showTuk={showTuk} />

        {/* drone shadow */}
        {d.shadowVisible && (
          <div
            style={{
              position: 'absolute',
              left: `${world.x.toFixed(2)}%`,
              top: '80.5%',
              transform: 'translateX(-50%)',
              width: 70,
              height: 13,
              borderRadius: '50%',
              background: 'rgba(31,58,82,.22)',
              zIndex: 3,
            }}
          />
        )}

        {/* drone (world coords, desktop scale) */}
        {world.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${world.x.toFixed(2)}%`,
              top: `${world.y.toFixed(2)}%`,
              transform: `translate(-50%,-50%) rotate(${world.tilt.toFixed(1)}deg) scale(1.7)`,
              zIndex: 10,
              width: 74,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'relative', height: 20 }}>
              <div style={{ position: 'absolute', top: 8, left: 0, width: 74, height: 3.5, background: '#372a54', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: 5, left: -6, width: 28, height: 7, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s linear infinite' }} />
              <div style={{ position: 'absolute', top: 5, right: -6, width: 28, height: 7, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s .05s linear infinite' }} />
              <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 38, height: 17, background: '#ff7a2f', border: '2.5px solid #372a54', borderRadius: 10 }} />
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 12, height: 7, background: '#cdeafc', border: '1.5px solid #372a54', borderRadius: 3 }} />
              <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
            </div>
            {d.parcelAttached && (
              <div style={{ position: 'absolute', top: 20, left: '50%', transformOrigin: 'top center', animation: 'sway 2.2s ease-in-out infinite' }}>
                <div style={{ width: 2, height: 20, background: '#372a54', marginLeft: -1 }} />
                <div style={{ position: 'relative', width: 24, height: 19, marginLeft: -12, background: '#d9915a', border: '2.5px solid #372a54', borderRadius: 4 }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '100%', background: '#ffc94d' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* confetti */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}>
        {d.confetti.map((c) => (
          <div
            key={c.key}
            style={{
              position: 'absolute',
              top: -14,
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.radius,
              ['--dx' as string]: `${c.dx}px`,
              animation: `confettiFallD ${c.dur}s ${c.delay}s cubic-bezier(.2,.6,.6,1) forwards`,
            }}
          />
        ))}
      </div>

      {/* top overlay: back / mute */}
      {onExit && (
        <div onClick={onExit} className="press back-btn" style={{ position: 'absolute', top: 24, left: 24, zIndex: 50, width: 44, height: 44, borderRadius: 14, fontSize: 20 }}>
          ‹
        </div>
      )}
      <div
        onClick={d.toggleMute}
        className="press back-btn"
        style={{ position: 'absolute', top: 24, right: 24, zIndex: 31, width: 44, height: 44, borderRadius: 14 }}
        aria-label={d.muted ? 'Unmute' : 'Mute'}
      >
        <SpeakerIcon muted={d.muted} size={24} />
      </div>

      {/* progress stepper */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          width: 'min(560px,60vw)',
          background: '#fff',
          border: '2.5px solid #372a54',
          borderRadius: 999,
          boxShadow: '0 3px 0 #372a54',
          padding: '10px 26px 9px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        {STEP_LABELS.map((label, i) => {
          const done = i < d.stepIdx || (d.stepIdx === 3 && i === 3);
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: done ? '#2fae60' : i === d.stepIdx ? '#ff7a2f' : '#e8ddf0',
                  border: '2px solid #372a54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#fff',
                  animation: i === d.stepIdx && d.stepIdx < 3 ? 'pulseDot 1s ease-in-out infinite' : 'none',
                }}
              >
                {done ? '✓' : ''}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  color: i <= d.stepIdx ? '#372a54' : '#b3a8c9',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* bottom overlay: status card */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 28,
          zIndex: 31,
          width: 'min(640px,90vw)',
          background: '#fff',
          border: '3px solid #372a54',
          borderRadius: 26,
          boxShadow: '0 6px 0 #372a54',
          padding: '18px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div className="fredoka" style={{ fontWeight: 600, fontSize: 19, color: '#372a54', lineHeight: 1.25 }}>
            {STATUS_TEXT[phase]}
          </div>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 17, color: '#17a398', whiteSpace: 'nowrap' }}>ETA {d.etaText}</div>
        </div>
        <div style={{ marginTop: 14, height: 16, border: '2.5px solid #372a54', borderRadius: 999, background: '#fdf6ea', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${d.progressPct.toFixed(1)}%`,
              background: 'repeating-linear-gradient(-45deg,#ffc94d 0 8px,#ff7a2f 8px 16px)',
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </div>
  );
}
