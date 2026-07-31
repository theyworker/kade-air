import type { ReactNode } from 'react';
import BrandLogo from './BrandLogo';
import DroneMark from './DroneMark';

type Props = {
  headline: string;
  body: ReactNode;
  /** the primary control — a Link, or a button for retry */
  action: ReactNode;
  footnote?: string;
};

// Shared shell for every dead end: stale link, 404, crash. One layout so the
// failure states stay on-brand and in sync with each other.
export default function ErrorScreen({ headline, body, action, footnote }: Props) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        background: 'linear-gradient(#8ed0f7 0%, #c8e9fb 46%, #ffedc2 72%, #fdf6ea 100%)',
        animation: 'fadeUp .4s ease',
      }}
    >
      <div style={{ width: 'min(440px, 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <DroneMark scale={1.5} />
          {/* ground shadow, so the drone reads as hovering rather than floating */}
          <div style={{ width: 76, height: 12, borderRadius: '50%', background: 'rgba(31,58,82,.18)', marginTop: 10, animation: 'shimmer 3s ease-in-out infinite' }} />
        </div>
        <h1 className="fredoka" style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 32, color: '#372a54', lineHeight: 1.1 }}>
          {headline}
        </h1>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#6d5f8e', lineHeight: 1.5 }}>{body}</p>
        <div style={{ width: '100%', marginTop: 12 }}>{action}</div>
        <BrandLogo width={132} style={{ marginTop: 10, opacity: 0.9 }} />
        {footnote && (
          <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#a394c2', letterSpacing: '.1em', textTransform: 'uppercase' }}>{footnote}</p>
        )}
      </div>
    </div>
  );
}
