import type { CSSProperties } from 'react';

// The dashboard borrows the app's look — cream paper, ink-purple outlines, the
// chunky offset shadow — so the control tower feels like the same product and
// not a bolted-on admin panel. These are the few tokens it needs; anything used
// once stays inline at its call site.

export const INK = '#372a54';
export const MUTED = '#8a7ba8';
export const PAPER = '#fdf6ea';
export const LINE = '#ece3f5';

/**
 * Data colours. Two, used in separate charts, each validated for contrast
 * against the cream surface (>= 3:1) and inside the readable lightness band.
 * Neither is an ink or a status colour, so a mark is never confusable with text
 * or with "something is wrong".
 */
export const SERIES = '#6d4aff';
export const BAR = '#e0623f';

export const card: CSSProperties = {
  background: '#fff',
  border: `2.5px solid ${INK}`,
  borderRadius: 20,
  boxShadow: `0 5px 0 ${INK}`,
};

export const label: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '.09em',
};

export const button: CSSProperties = {
  ...card,
  boxShadow: `0 3px 0 ${INK}`,
  borderRadius: 14,
  padding: '10px 16px',
  fontFamily: 'var(--font-fredoka), sans-serif',
  fontWeight: 600,
  fontSize: 14,
  color: INK,
  background: '#fff',
  cursor: 'pointer',
  // --lift/--drop/--rest tune the .press shadow; see globals.css.
  ['--lift' as string]: '3px',
  ['--drop' as string]: '3px',
  ['--rest' as string]: '0px',
};
