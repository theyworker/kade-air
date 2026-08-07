'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ConfettiPiece,
  FlightGeometry,
  MOBILE_GEOMETRY,
  Phase,
  STEP_INDEX,
  WorldState,
  durations,
  makeConfetti,
  phaseAt,
  worldAt,
} from './flight';
import { blip, buzz, ding } from './sound';

export type Delivery = {
  el: number;
  phase: Phase;
  world: WorldState;
  stepIdx: number;
  kitchenBusy: boolean;
  handoffActive: boolean;
  handoffDur: number;
  parcelAttached: boolean;
  airborne: boolean;
  shadowVisible: boolean;
  ticketStamped: boolean;
  progressPct: number;
  etaText: string;
  confetti: ConfettiPiece[];
  revealed: boolean;
  muted: boolean;
  toggleMute: () => void;
};

// Runs the delivery sequence from mount: ticks a 40ms clock, fires
// sounds/haptics/confetti on phase changes, and derives everything the
// track scene needs. Remount (change key) to replay.
export function useDelivery(fastMode = false, geometry: FlightGeometry = MOBILE_GEOMETRY, desktop = false): Delivery {
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(t0);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const lastPhase = useRef<Phase>('accepted');

  useEffect(() => {
    const D = durations(fastMode);
    const total = D.acc + D.prep + D.disp + D.fly + D.arr;
    const timer = setInterval(() => {
      const el = Date.now() - t0;
      const ph = phaseAt(el, D);
      if (ph !== lastPhase.current) {
        lastPhase.current = ph;
        if (ph === 'preparing' && !mutedRef.current) blip(440);
        if (ph === 'dispatched') {
          buzz(30);
          if (!mutedRef.current) blip(660);
        }
        if (ph === 'delivered') {
          buzz([40, 60, 40]);
          if (!mutedRef.current) ding();
          setConfetti(makeConfetti(desktop));
          setTimeout(() => setRevealed(true), 700);
        }
      }
      if (el > total + D.exit + 1500) clearInterval(timer);
      setNow(Date.now());
    }, 40);
    return () => clearInterval(timer);
  }, [t0, fastMode, desktop]);

  const D = durations(fastMode);
  const el = now - t0;
  const phase = phaseAt(el, D);
  const world = worldAt(el, phase, D, geometry);
  const flying = phase === 'in_flight' || phase === 'arriving';

  const total = D.acc + D.prep + D.disp + D.fly + D.arr;
  const etaS = Math.max(0, Math.ceil((total - el) / 1000));

  return {
    el,
    phase,
    world,
    stepIdx: STEP_INDEX[phase],
    kitchenBusy: phase === 'accepted' || phase === 'preparing',
    handoffActive: phase === 'dispatched' && world.dispP < 0.5,
    handoffDur: +((D.disp * 0.45) / 1000).toFixed(2),
    parcelAttached: (phase === 'dispatched' && world.dispP >= 0.5) || flying,
    // shortly after lift-off, once the drone is clear of the kitchen roof
    airborne: el > D.acc + D.prep + D.disp * 0.75,
    shadowVisible: flying || (phase === 'delivered' && world.visible),
    ticketStamped: el > D.acc * 0.45,
    progressPct: Math.min(100, (el / total) * 100),
    etaText: phase === 'delivered' ? '0:00' : '0:' + String(etaS).padStart(2, '0'),
    confetti,
    revealed,
    muted,
    toggleMute: () => setMuted((m) => !m),
  };
}
