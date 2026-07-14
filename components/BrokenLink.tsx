import Link from 'next/link';

// Playful fallback for invalid or mangled share links. Standalone
// full-viewport screen — works at any size, no phone shell.
export default function BrokenLink() {
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
        <div style={{ fontSize: 64, animation: 'bob 3s ease-in-out infinite' }}>🚁</div>
        <div className="fredoka" style={{ fontWeight: 700, fontSize: 32, color: '#372a54', lineHeight: 1.1 }}>
          Ayyo. This link went stale.
        </div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#6d5f8e', lineHeight: 1.5 }}>
          The drone circled Colombo three times and couldn&apos;t find your parcel. It happens — even to imaginary food.
        </p>
        <Link
          href="/"
          className="press cta"
          style={{ display: 'block', width: '100%', background: '#ff7a2f', fontSize: 20, textDecoration: 'none', marginTop: 12 }}
        >
          Send someone food instead →
        </Link>
      </div>
    </div>
  );
}
