import type { CSSProperties } from 'react';

type Props = {
  src: string;
  alt?: string;
  /** box the icon is fitted into, in px */
  size: number | string;
  style?: CSSProperties;
};

// The food icons are square PNGs — always fitted, never cropped.
export default function DishIcon({ src, alt = '', size, style }: Props) {
  return (
    <div style={{ width: size, height: size, flex: 'none', ...style }}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
    </div>
  );
}
