import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  durations,
  phaseAt,
  easeIO,
  worldAt,
  MOBILE_GEOMETRY,
  DESKTOP_GEOMETRY,
  STATUS_TEXT,
  STEP_INDEX,
  makeConfetti,
  type Phase,
  type FlightGeometry,
} from '../lib/flight';

describe('durations', () => {
  test('normal mode uses the hand-tuned kitchen + flight timings', () => {
    const D = durations(false);
    assert.deepEqual(D, { acc: 2000, prep: 9000, disp: 4000, fly: 9000, arr: 4000, exit: 2000 });
  });

  test('fastMode scales acc, prep, disp, fly, and arr by 0.4', () => {
    const normal = durations(false);
    const fast = durations(true);
    assert.equal(fast.acc, normal.acc * 0.4);
    assert.equal(fast.prep, normal.prep * 0.4);
    assert.equal(fast.disp, normal.disp * 0.4);
    assert.equal(fast.fly, normal.fly * 0.4);
    assert.equal(fast.arr, normal.arr * 0.4);
  });

  test('fastMode does NOT scale exit — it stays 2000 in both modes', () => {
    // This asymmetry is easy to "tidy" away by someone who assumes fastMode
    // scales every field uniformly. It doesn't: exit is a fixed 2000ms in
    // both modes, so it is asserted here on its own.
    assert.equal(durations(false).exit, 2000);
    assert.equal(durations(true).exit, 2000);
    assert.equal(durations(true).exit, durations(false).exit);
  });

  test('defaults to normal (non-fast) mode when called with no argument', () => {
    assert.deepEqual(durations(), durations(false));
  });
});

describe('phaseAt boundaries', () => {
  // Boundary offsets are derived from a real durations() result, never
  // hardcoded milliseconds, per the plan's controller decision.
  const D = durations(false);
  const b1 = D.acc;
  const b2 = b1 + D.prep;
  const b3 = b2 + D.disp;
  const b4 = b3 + D.fly;
  const b5 = b4 + D.arr;

  test('t = 0 is accepted', () => {
    assert.equal(phaseAt(0, D), 'accepted');
  });

  const cases: [string, number, Phase, Phase][] = [
    ['acc', b1, 'accepted', 'preparing'],
    ['acc+prep', b2, 'preparing', 'dispatched'],
    ['acc+prep+disp', b3, 'dispatched', 'in_flight'],
    ['acc+prep+disp+fly', b4, 'in_flight', 'arriving'],
    ['acc+prep+disp+fly+arr', b5, 'arriving', 'delivered'],
  ];

  for (const [label, boundary, before, after] of cases) {
    test(`at ${label}, one tick before is still ${before}`, () => {
      assert.equal(phaseAt(boundary - 1, D), before);
    });

    // The comparison inside phaseAt is strictly "<", so the boundary value
    // itself already belongs to the LATER phase, not the earlier one.
    test(`at ${label}, the boundary value itself is already ${after}`, () => {
      assert.equal(phaseAt(boundary, D), after);
    });
  }

  test('a time past the end is delivered', () => {
    assert.equal(phaseAt(b5 + 1, D), 'delivered');
  });

  test('stays delivered for a very large input', () => {
    assert.equal(phaseAt(b5 + 1_000_000_000, D), 'delivered');
    assert.equal(phaseAt(Number.MAX_SAFE_INTEGER, D), 'delivered');
  });
});

describe('easeIO', () => {
  test('0 -> 0', () => {
    assert.equal(easeIO(0), 0);
  });

  test('1 -> 1', () => {
    assert.equal(easeIO(1), 1);
  });

  test('0.5 -> 0.5', () => {
    assert.equal(easeIO(0.5), 0.5);
  });

  test('clamps input below 0 to the t=0 result', () => {
    assert.equal(easeIO(-5), easeIO(0));
    assert.equal(easeIO(-5), 0);
  });

  test('clamps input above 1 to the t=1 result', () => {
    assert.equal(easeIO(5), easeIO(1));
    assert.equal(easeIO(5), 1);
  });

  test('is monotonically non-decreasing across a sweep of 0..1', () => {
    let prev = easeIO(0);
    for (let i = 1; i <= 100; i++) {
      const t = i / 100;
      const value = easeIO(t);
      assert.ok(value >= prev, `easeIO(${t}) = ${value} should be >= previous ${prev}`);
      prev = value;
    }
  });
});

describe('worldAt path continuity — no teleporting across phase boundaries', () => {
  // Tolerance reasoning: at each boundary we sample worldAt at
  // (boundary - 1ms) and (boundary + 1ms). A drone that is legitimately
  // moving covers a small distance in that 2ms window — on this flight the
  // fastest-moving segments cover roughly 0.01-0.05 world-% per 2ms, but the
  // *derivative-driven* sampling artifact right at a boundary (where easeIO's
  // slope is small near its own 0/1 clamp points) measures nearer 1e-5 world-%
  // in this codebase (verified by direct computation). A tolerance of 1e-3
  // world-% is ~100x that measured sampling noise, so it comfortably absorbs
  // the 2ms sampling window without being loose enough to hide a real jump —
  // the one genuine discontinuity found below (~0.5 world-%, see the
  // DESKTOP_GEOMETRY test) is 500x larger than this tolerance and would fail
  // it immediately.
  const CONTINUITY_TOLERANCE = 1e-3;

  const D = durations(false);
  const b1 = D.acc;
  const b2 = b1 + D.prep;
  const b3 = b2 + D.disp;
  const b4 = b3 + D.fly;
  const b5 = b4 + D.arr;

  function sample(el: number, G: FlightGeometry) {
    return worldAt(el, phaseAt(el, D), D, G);
  }

  function assertContinuous(label: string, boundary: number, G: FlightGeometry) {
    const before = sample(boundary - 1, G);
    const after = sample(boundary + 1, G);
    const dx = Math.abs(after.x - before.x);
    const dy = Math.abs(after.y - before.y);
    assert.ok(
      dx < CONTINUITY_TOLERANCE,
      `${label}: x jumped by ${dx} (before ${before.x}, after ${after.x})`
    );
    assert.ok(
      dy < CONTINUITY_TOLERANCE,
      `${label}: y jumped by ${dy} (before ${before.y}, after ${after.y})`
    );
  }

  const smoothBoundaries: [string, number][] = [
    ['accepted -> preparing', b1],
    ['preparing -> dispatched', b2],
    ['dispatched -> in_flight', b3],
    ['in_flight -> arriving', b4],
  ];

  for (const [label, boundary] of smoothBoundaries) {
    test(`MOBILE_GEOMETRY: ${label} does not teleport`, () => {
      assertContinuous(label, boundary, MOBILE_GEOMETRY);
    });

    test(`DESKTOP_GEOMETRY: ${label} does not teleport`, () => {
      assertContinuous(label, boundary, DESKTOP_GEOMETRY);
    });
  }

  test('MOBILE_GEOMETRY: arriving -> delivered does not teleport', () => {
    assertContinuous('arriving -> delivered', b5, MOBILE_GEOMETRY);
  });

  // --- Known discontinuity: DESKTOP_GEOMETRY at arriving -> delivered ---
  //
  // BUG / HAND-TUNING MISMATCH (documented, not fixed — see task constraints):
  // The arriving phase ends at y = 29.5 + G.arrDy (p reaches 1), and the
  // delivered phase begins at y = G.exitY0 (p starts at 0). For these to
  // line up, a geometry needs 29.5 + arrDy === exitY0.
  //   MOBILE_GEOMETRY:  29.5 + 32.5 = 62   === exitY0 (62)   -> continuous
  //   DESKTOP_GEOMETRY: 29.5 + 31   = 60.5 !== exitY0 (60)   -> off by 0.5
  // This is a real ~0.5 world-% jump in y at this single boundary, on
  // DESKTOP_GEOMETRY only — not a sampling artifact (it's present even
  // comparing the exact boundary formulas, not just the +/-1ms samples).
  // Per the task's constraints we document the ACTUAL behaviour rather than
  // "fix" lib/flight.ts, and flag it prominently in the report.
  test('DESKTOP_GEOMETRY: arriving -> delivered has a documented ~0.5 y jump (known geometry mismatch, NOT a sampling artifact — see comment above)', () => {
    const before = sample(b5 - 1, DESKTOP_GEOMETRY);
    const after = sample(b5 + 1, DESKTOP_GEOMETRY);
    const dy = after.y - before.y;

    // Expected gap derived directly from the source formulas, not a magic
    // number: arriving's y formula converges to 29.5 + arrDy as p -> 1;
    // delivered's y formula starts at exitY0 as p -> 0.
    const expectedGap = 29.5 + DESKTOP_GEOMETRY.arrDy - DESKTOP_GEOMETRY.exitY0;
    assert.equal(expectedGap, 0.5);

    // Pin the measured jump to the expected gap (within a tiny epsilon for
    // the +/-1ms sampling window), proving this is that geometry mismatch
    // and not some other bug.
    assert.ok(
      Math.abs(dy - -expectedGap) < 1e-2,
      `expected the desktop y jump to match the geometry mismatch of ~${-expectedGap}, got ${dy}`
    );

    // And demonstrate it clears the general continuity tolerance used for
    // every other boundary above — this is the discontinuity that
    // tolerance is deliberately NOT loose enough to hide.
    assert.ok(Math.abs(dy) > CONTINUITY_TOLERANCE * 100);
  });
});

describe('worldAt anchors', () => {
  const D = durations(false);
  const total = D.acc + D.prep + D.disp + D.fly + D.arr + D.exit;

  for (const [name, G] of [
    ['MOBILE_GEOMETRY', MOBILE_GEOMETRY],
    ['DESKTOP_GEOMETRY', DESKTOP_GEOMETRY],
  ] as const) {
    test(`${name}: at t=0 the drone sits at parkX/parkY and is visible`, () => {
      const w = worldAt(0, phaseAt(0, D), D, G);
      assert.equal(w.x, G.parkX);
      assert.equal(w.y, G.parkY);
      assert.equal(w.visible, true);
    });
  }

  test('cam starts at 0', () => {
    const w = worldAt(0, phaseAt(0, D), D, MOBILE_GEOMETRY);
    assert.equal(w.cam, 0);
  });

  test('cam never decreases across a sweep of the whole flight (camera only pans forward)', () => {
    // cam does not depend on the geometry argument in lib/flight.ts (no
    // branch reads G when computing cam), so sweeping once is sufficient.
    const steps = 500;
    let prevCam = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const el = (total * i) / steps;
      const w = worldAt(el, phaseAt(el, D), D, MOBILE_GEOMETRY);
      assert.ok(w.cam >= prevCam - 1e-9, `cam decreased at el=${el}: ${w.cam} < ${prevCam}`);
      prevCam = w.cam;
    }
  });

  test('visible stays true for the entire flight up to the very end of delivered', () => {
    const dispStart = D.acc + D.prep;
    const deliveredStart = dispStart + D.disp + D.fly + D.arr;
    // One tick before the delivered phase's exit animation completes.
    const el = deliveredStart + D.exit - 1;
    const w = worldAt(el, phaseAt(el, D), D, MOBILE_GEOMETRY);
    assert.equal(w.visible, true);
  });

  test('visible becomes false exactly when the delivered phase completes (p >= 1)', () => {
    const dispStart = D.acc + D.prep;
    const deliveredStart = dispStart + D.disp + D.fly + D.arr;
    const completion = deliveredStart + D.exit;
    const w = worldAt(completion, phaseAt(completion, D), D, MOBILE_GEOMETRY);
    assert.equal(w.visible, false);
  });

  test('visible stays false well beyond the end of the flight', () => {
    const dispStart = D.acc + D.prep;
    const deliveredStart = dispStart + D.disp + D.fly + D.arr;
    const el = deliveredStart + D.exit + 1_000_000;
    const w = worldAt(el, phaseAt(el, D), D, MOBILE_GEOMETRY);
    assert.equal(w.visible, false);
  });
});

describe('dispP', () => {
  const D = durations(false);
  const dispStart = D.acc + D.prep;
  const dispEnd = dispStart + D.disp;

  test('is 0 outside the dispatched phase (accepted, preparing, in_flight, arriving, delivered)', () => {
    const offPhaseSamples: number[] = [
      0, // accepted
      D.acc + 1, // preparing
      dispEnd + 1, // in_flight
      dispEnd + D.fly + 1, // arriving
      dispEnd + D.fly + D.arr + 1, // delivered
    ];
    for (const el of offPhaseSamples) {
      const phase = phaseAt(el, D);
      const w = worldAt(el, phase, D, MOBILE_GEOMETRY);
      assert.equal(w.dispP, 0, `expected dispP=0 at el=${el} (phase ${phase})`);
    }
  });

  test('runs from 0 up towards 1 across the dispatched phase', () => {
    const atStart = worldAt(dispStart, phaseAt(dispStart, D), D, MOBILE_GEOMETRY);
    assert.equal(atStart.dispP, 0);

    const nearEnd = worldAt(dispEnd - 1, phaseAt(dispEnd - 1, D), D, MOBILE_GEOMETRY);
    assert.ok(nearEnd.dispP > 0.99, `expected dispP near 1 just before dispatched ends, got ${nearEnd.dispP}`);

    // Monotonic across the phase.
    let prev = -Infinity;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const el = dispStart + (D.disp * i) / steps;
      const phase = phaseAt(Math.min(el, dispEnd - 1), D); // stay inside dispatched
      const w = worldAt(Math.min(el, dispEnd - 1), phase, D, MOBILE_GEOMETRY);
      assert.ok(w.dispP >= prev - 1e-9, `dispP decreased at el=${el}: ${w.dispP} < ${prev}`);
      prev = w.dispP;
    }
  });
});

describe('phase completeness (STATUS_TEXT / STEP_INDEX)', () => {
  // PHASE_MAP is typed as Record<Phase, true>, not Phase[]. A plain array
  // literal typed as Phase[] would still typecheck fine even if a newly
  // added Phase were left out of it — TypeScript doesn't enforce array
  // literals to be exhaustive. A Record<Phase, true> object literal DOES:
  // if lib/flight.ts's Phase union grows a new member, this object literal
  // is missing a required property and `npm run build` fails to typecheck
  // right here, forcing this test file to be updated rather than silently
  // under-covering the new phase.
  const PHASE_MAP: Record<Phase, true> = {
    accepted: true,
    preparing: true,
    dispatched: true,
    in_flight: true,
    arriving: true,
    delivered: true,
  };
  const ALL_PHASES = Object.keys(PHASE_MAP) as Phase[];

  test('STATUS_TEXT has a non-empty string entry for every phase', () => {
    for (const phase of ALL_PHASES) {
      const text = STATUS_TEXT[phase];
      assert.equal(typeof text, 'string');
      assert.ok(text.length > 0, `STATUS_TEXT[${phase}] should not be empty`);
    }
  });

  test('STEP_INDEX has a numeric entry for every phase', () => {
    for (const phase of ALL_PHASES) {
      assert.equal(typeof STEP_INDEX[phase], 'number');
    }
  });

  test('STEP_INDEX values are non-decreasing in phase order', () => {
    let prev = -Infinity;
    for (const phase of ALL_PHASES) {
      const value = STEP_INDEX[phase];
      assert.ok(value >= prev, `STEP_INDEX[${phase}] = ${value} should be >= previous ${prev}`);
      prev = value;
    }
  });

  test('STEP_INDEX matches the documented step grouping (0,1,2,2,2,3)', () => {
    assert.deepEqual(
      ALL_PHASES.map((p) => STEP_INDEX[p]),
      [0, 1, 2, 2, 2, 3]
    );
  });
});

describe('makeConfetti', () => {
  const BATCHES = 20;

  test('mobile mode returns 28 pieces', () => {
    const pieces = makeConfetti(false);
    assert.equal(pieces.length, 28);
  });

  test('desktop mode returns 40 pieces', () => {
    const pieces = makeConfetti(true);
    assert.equal(pieces.length, 40);
  });

  test('defaults to mobile mode (28 pieces) when called with no argument', () => {
    assert.equal(makeConfetti().length, 28);
  });

  test('every piece in a batch has a unique key', () => {
    for (const desktop of [false, true]) {
      const pieces = makeConfetti(desktop);
      const keys = new Set(pieces.map((p) => p.key));
      assert.equal(keys.size, pieces.length, `duplicate keys found for desktop=${desktop}`);
    }
  });

  test('mobile "left" stays within its documented 8..92 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(false)) {
        assert.ok(piece.left >= 8 && piece.left <= 8 + 84, `left out of band: ${piece.left}`);
      }
    }
  });

  test('desktop "left" stays within its documented 4..96 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(true)) {
        assert.ok(piece.left >= 4 && piece.left <= 4 + 92, `left out of band: ${piece.left}`);
      }
    }
  });

  test('mobile "size" stays within its documented 7..13 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(false)) {
        assert.ok(piece.size >= 7 && piece.size <= 7 + 6, `size out of band: ${piece.size}`);
      }
    }
  });

  test('desktop "size" stays within its documented 8..15 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(true)) {
        assert.ok(piece.size >= 8 && piece.size <= 8 + 7, `size out of band: ${piece.size}`);
      }
    }
  });

  test('mobile "dx" stays within its documented -70..70 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(false)) {
        assert.ok(piece.dx >= -70 && piece.dx <= 70, `dx out of band: ${piece.dx}`);
      }
    }
  });

  test('desktop "dx" stays within its documented -100..100 band across many batches', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of makeConfetti(true)) {
        assert.ok(piece.dx >= -100 && piece.dx <= 100, `dx out of band: ${piece.dx}`);
      }
    }
  });

  test('"delay" falls within 0..0.5 across many batches (both variants)', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of [...makeConfetti(false), ...makeConfetti(true)]) {
        assert.ok(piece.delay >= 0 && piece.delay <= 0.5, `delay out of band: ${piece.delay}`);
      }
    }
  });

  test('"dur" falls within 1.6..2.7 across many batches (both variants)', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of [...makeConfetti(false), ...makeConfetti(true)]) {
        assert.ok(piece.dur >= 1.6 && piece.dur <= 2.7, `dur out of band: ${piece.dur}`);
      }
    }
  });

  test('"radius" is always either "50%" or "2px"', () => {
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of [...makeConfetti(false), ...makeConfetti(true)]) {
        assert.ok(piece.radius === '50%' || piece.radius === '2px', `unexpected radius: ${piece.radius}`);
      }
    }
  });

  test('"color" is always one of the six documented palette colors', () => {
    const palette = new Set(['#ff7a2f', '#ffd166', '#2fae60', '#17a398', '#ff6f9c', '#7c5cff']);
    for (let b = 0; b < BATCHES; b++) {
      for (const piece of [...makeConfetti(false), ...makeConfetti(true)]) {
        assert.ok(palette.has(piece.color), `unexpected color: ${piece.color}`);
      }
    }
  });
});
