// Timing + world-coordinate math for the drone delivery sequence,
// ported 1:1 from the Kade Air Sunny design file.

export type Phase =
  | 'accepted'
  | 'preparing'
  | 'dispatched'
  | 'in_flight'
  | 'arriving'
  | 'delivered';

export type Durations = {
  acc: number;
  prep: number;
  disp: number;
  fly: number;
  arr: number;
  exit: number;
};

export function durations(fastMode = false): Durations {
  const m = fastMode ? 0.4 : 1;
  return { acc: 1400 * m, prep: 4200 * m, disp: 2600 * m, fly: 5200 * m, arr: 2200 * m, exit: 2000 };
}

export function phaseAt(el: number, D: Durations): Phase {
  let t = D.acc;
  if (el < t) return 'accepted';
  if (el < (t += D.prep)) return 'preparing';
  if (el < (t += D.disp)) return 'dispatched';
  if (el < (t += D.fly)) return 'in_flight';
  if (el < (t += D.arr)) return 'arriving';
  return 'delivered';
}

export function easeIO(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export type WorldState = {
  x: number; // drone x, % of the 3-viewport-wide world
  y: number; // drone y, % of world height
  tilt: number;
  visible: boolean;
  cam: number; // camera pan, translateX(-cam%) on the world
  dispP: number; // progress through the dispatched phase, 0..1
};

// Flight-path constants differ slightly between the mobile and desktop
// scenes (launch pad and doorstep sit at different heights).
export type FlightGeometry = {
  parkX: number;
  parkY: number;
  liftDx: number;
  liftDy: number;
  flyX0: number;
  flyDx: number;
  arrDy: number;
  exitY0: number;
};

export const MOBILE_GEOMETRY: FlightGeometry = {
  parkX: 28.5, parkY: 62.5, liftDx: 5, liftDy: 33, flyX0: 33.5, flyDx: 57, arrDy: 32.5, exitY0: 62,
};

export const DESKTOP_GEOMETRY: FlightGeometry = {
  parkX: 30, parkY: 60, liftDx: 4, liftDy: 30.5, flyX0: 34, flyDx: 56.5, arrDy: 31, exitY0: 60,
};

// World layout: kitchen occupies 0-33.3%, skyline 33.3-100%.
// Drone parks on the launch pad and lands at the doorstep around x 92.
export function worldAt(el: number, phase: Phase, D: Durations, G: FlightGeometry = MOBILE_GEOMETRY): WorldState {
  let x = G.parkX,
    y = G.parkY,
    tilt = 0,
    visible = true,
    cam = 0;
  const dispStart = D.acc + D.prep;
  const dispP = phase === 'dispatched' ? (el - dispStart) / D.disp : 0;
  if (phase === 'dispatched') {
    const p = dispP;
    const lift = easeIO(Math.max(0, (p - 0.45) / 0.55));
    x = G.parkX + lift * G.liftDx;
    y = G.parkY - lift * G.liftDy;
    tilt = -6 * lift;
    cam = easeIO(Math.max(0, (p - 0.55) / 0.45)) * 26.67;
  } else if (phase === 'in_flight') {
    const p = easeIO((el - dispStart - D.disp) / D.fly);
    x = G.flyX0 + p * G.flyDx;
    y = 29.5 - 7 * Math.sin(p * Math.PI);
    tilt = -8;
    cam = 26.67 + p * 40;
  } else if (phase === 'arriving') {
    const p = easeIO((el - dispStart - D.disp - D.fly) / D.arr);
    x = 90.5 + p * 1.5;
    y = 29.5 + p * G.arrDy;
    tilt = -8 + p * 8;
    cam = 66.67;
  } else if (phase === 'delivered') {
    const p = Math.min(1, (el - dispStart - D.disp - D.fly - D.arr) / D.exit);
    const pe = p * p;
    x = 92 + pe * 8;
    y = G.exitY0 - pe * 50;
    tilt = -12 * p;
    cam = 66.67;
    if (p >= 1) visible = false;
  }
  return { x, y, tilt, visible, cam, dispP };
}

export const STATUS_TEXT: Record<Phase, string> = {
  accepted: 'Order #8FQ2 is in! Kade uncle says hari hari.',
  preparing: 'Chef Sanath is on it — hear that chop-chop-chop?',
  dispatched: 'Parcel loaded. Drone taking off — hold tight!',
  in_flight: 'Cruising over Colombo… nice breeze, ah?',
  arriving: 'Descending! Go look outside, seriously.',
  delivered: 'Landed! (well… sort of)',
};

export const STEP_INDEX: Record<Phase, number> = {
  accepted: 0,
  preparing: 1,
  dispatched: 2,
  in_flight: 2,
  arriving: 2,
  delivered: 3,
};

export type ConfettiPiece = {
  key: number;
  left: number;
  size: number;
  color: string;
  radius: string;
  dx: number;
  delay: number;
  dur: number;
};

export function makeConfetti(desktop = false): ConfettiPiece[] {
  const colors = ['#ff7a2f', '#ffd166', '#2fae60', '#17a398', '#ff6f9c', '#7c5cff'];
  const count = desktop ? 40 : 28;
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    left: desktop ? 4 + Math.random() * 92 : 8 + Math.random() * 84,
    size: desktop ? 8 + Math.round(Math.random() * 7) : 7 + Math.round(Math.random() * 6),
    color: colors[i % colors.length],
    radius: Math.random() > 0.5 ? '50%' : '2px',
    dx: desktop ? Math.round(Math.random() * 200 - 100) : Math.round(Math.random() * 140 - 70),
    delay: +(Math.random() * 0.5).toFixed(2),
    dur: +(1.6 + Math.random() * 1.1).toFixed(2),
  }));
}
