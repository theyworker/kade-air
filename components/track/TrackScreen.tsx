'use client';

import { preload } from 'react-dom';
import type { Dish } from '@/lib/dishes';
import { STATUS_TEXT } from '@/lib/flight';
import { useDelivery } from '@/lib/useDelivery';
import Drone from './Drone';
import Kitchen from './Kitchen';
import Skyline from './Skyline';

type Props = {
  dish: Dish;
  senderDisplay: string;
  recipientDisplay: string;
  msgDisplay: string;
  onExit?: () => void; // back button; hidden when absent
  onLoop: () => void;
  fastMode?: boolean;
  showTuk?: boolean;
};

const STEP_LABELS = ['Accepted', 'Preparing', 'Dispatched', 'Delivered'];

export default function TrackScreen({ dish, senderDisplay, recipientDisplay, msgDisplay, onExit, onLoop, fastMode = false, showTuk = true }: Props) {
  const d = useDelivery(fastMode);
  const { phase, world } = d;

  // The reveal is a 1254px PNG — fetch it while the drone is still flying.
  preload(dish.high, { as: 'image' });

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#8ed0f7' }}>
      {/* WORLD (3 viewports wide, camera pans) */}
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
        {/* sun + clouds (world-wide) */}
        <div style={{ position: 'absolute', top: 60, left: '56%', width: 84, height: 84, pointerEvents: 'none', zIndex: 1 }}>
          <div
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(255,209,102,.5) 0 9deg, transparent 9deg 30deg)',
              animation: 'sunSpin 26s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 10,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #ffe59a, #ffc94d)',
              border: '3px solid #372a54',
              boxShadow: '0 0 34px rgba(255,201,77,.8)',
            }}
          />
        </div>
        <div style={{ position: 'absolute', top: 110, left: '64%', width: 84, height: 26, background: '#fff', borderRadius: 20, border: '2.5px solid #372a54', zIndex: 1, animation: 'drift 11s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: 180, left: '80%', width: 60, height: 20, background: '#fff', borderRadius: 20, border: '2.5px solid #372a54', opacity: 0.92, zIndex: 1, animation: 'drift 14s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: 70, left: '22%', width: 66, height: 21, background: '#fff', borderRadius: 20, border: '2.5px solid #372a54', opacity: 0.95, zIndex: 1, animation: 'drift 13s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: 230, left: '92%', zIndex: 1, animation: 'floaty 4.5s ease-in-out infinite' }}>
          <div style={{ width: 17, height: 17, background: '#ff6f9c', border: '2.5px solid #372a54', borderRadius: 3 }} />
        </div>

        <Kitchen
          ticketStamped={d.ticketStamped}
          kitchenBusy={d.kitchenBusy}
          chefHanding={phase === 'dispatched'}
          handoffActive={d.handoffActive}
          handoffDur={d.handoffDur}
        />

        <Skyline padActive={phase === 'arriving'} landed={phase === 'delivered'} dishIcon={dish.low} dishName={dish.name} showTuk={showTuk} />

        {/* drone shadow */}
        {d.shadowVisible && (
          <div
            style={{
              position: 'absolute',
              left: `${world.x.toFixed(2)}%`,
              top: '80.5%',
              transform: 'translateX(-50%)',
              width: 40,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(31,58,82,.22)',
              zIndex: 3,
            }}
          />
        )}

        {world.visible && <Drone x={+world.x.toFixed(2)} y={+world.y.toFixed(2)} tilt={+world.tilt.toFixed(1)} parcelAttached={d.parcelAttached} />}
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
              animation: `confettiFall ${c.dur}s ${c.delay}s cubic-bezier(.2,.6,.6,1) forwards`,
            }}
          />
        ))}
      </div>

      {/* top overlay: back / mute */}
      {onExit && (
        <div onClick={onExit} className="press back-btn" style={{ position: 'absolute', top: 56, left: 14, zIndex: 50, width: 36, height: 36, fontSize: 17 }}>
          ‹
        </div>
      )}
      <div
        onClick={d.toggleMute}
        className="press back-btn"
        style={{ position: 'absolute', top: 56, right: 14, zIndex: 31, width: 36, height: 36, fontSize: 15 }}
      >
        {d.muted ? '🔇' : '🔊'}
      </div>

      {/* progress stepper */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 58,
          right: 58,
          zIndex: 30,
          background: '#fff',
          border: '2.5px solid #372a54',
          borderRadius: 999,
          boxShadow: '0 3px 0 #372a54',
          padding: '7px 14px 6px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        {STEP_LABELS.map((label, i) => {
          const done = i < d.stepIdx || (d.stepIdx === 3 && i === 3);
          return (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: done ? '#2fae60' : i === d.stepIdx ? '#ff7a2f' : '#e8ddf0',
                  border: '2px solid #372a54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#fff',
                  animation: i === d.stepIdx && d.stepIdx < 3 ? 'pulseDot 1s ease-in-out infinite' : 'none',
                }}
              >
                {done ? '✓' : ''}
              </div>
              <div
                style={{
                  fontSize: 8.5,
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

      {/* full-screen reveal: the food slowly zooms while the note is read */}
      {d.revealed ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: '#fdf6ea',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '78px 22px calc(24px + env(safe-area-inset-bottom))',
            textAlign: 'center',
            animation: 'popIn .55s cubic-bezier(.2,1.4,.5,1) both',
          }}
        >
          <div
            style={{
              width: 'min(58vw,240px)',
              aspectRatio: '1',
              borderRadius: '50%',
              background: dish.c,
              border: '4px solid #372a54',
              boxShadow: '0 8px 0 #372a54',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
              overflow: 'hidden',
              padding: 16,
            }}
          >
            <img
              src={dish.high}
              alt={dish.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 6px 8px rgba(55,42,84,.18))' }}
            />
          </div>
          <div className="fredoka" style={{ fontWeight: 600, fontSize: 19, color: '#6d5f8e', lineHeight: 1.15, marginTop: 20 }}>
            {dish.name} — delivered!
          </div>
          <div className="fredoka" style={{ marginTop: 18, fontWeight: 700, fontSize: 38, lineHeight: 1.12, letterSpacing: '-.8px', color: '#372a54', textWrap: 'pretty', maxWidth: 360 }}>
            “{msgDisplay}”
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#8a7ba8', letterSpacing: '.02em', marginTop: 12 }}>— from {senderDisplay}</div>
          <div
            onClick={onLoop}
            className="press cta"
            style={{ marginTop: 'auto', alignSelf: 'stretch', background: '#ff7a2f', borderRadius: 16, fontSize: 17, padding: 14, ['--lift' as string]: '5px', ['--drop' as string]: '4px' }}
          >
            Nice. What now? →
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 18,
            zIndex: 31,
            background: '#fff',
            border: '3px solid #372a54',
            borderRadius: 24,
            boxShadow: '0 6px 0 #372a54',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div className="fredoka" style={{ fontWeight: 600, fontSize: 16, color: '#372a54', lineHeight: 1.25 }}>
              {STATUS_TEXT[phase]}
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#17a398', whiteSpace: 'nowrap' }}>ETA {d.etaText}</div>
          </div>
          <div style={{ marginTop: 12, height: 14, border: '2.5px solid #372a54', borderRadius: 999, background: '#fdf6ea', overflow: 'hidden' }}>
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
      )}
    </div>
  );
}
