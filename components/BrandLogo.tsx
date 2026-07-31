import type { CSSProperties } from 'react';

// The AirKade lockup — drone, wordmark and the "nothing arrives" ribbon are all
// baked into one asset, so the only knob callers need is how wide to draw it.
const SRC = '/brand/airkade-logo.webp';
const RATIO = 1536 / 1024;

type Props = {
  /** rendered width — px, or any CSS length; height follows the artwork's ratio */
  width: number | string;
  style?: CSSProperties;
  priority?: boolean;
};

export default function BrandLogo({ width, style, priority = false }: Props) {
  // Intrinsic size only when the caller gave plain px, so the browser can
  // reserve the box; CSS lengths fall back to the aspect ratio alone.
  const px = typeof width === 'number' ? width : undefined;
  return (
    <img
      src={SRC}
      alt="AirKade — nothing arrives"
      width={px}
      height={px && Math.round(px / RATIO)}
      fetchPriority={priority ? 'high' : undefined}
      style={{ display: 'block', width, height: 'auto', aspectRatio: RATIO, ...style }}
    />
  );
}
