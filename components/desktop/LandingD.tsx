'use client';

import BrandLogo from '../BrandLogo';
import { floatArt } from '@/lib/dishes';
import { useRotatingWord } from '@/lib/useRotatingWord';

export default function LandingD({ onStart }: { onStart: () => void }) {
  const word = useRotatingWord();

  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(460px,44%) 1fr',
        overflow: 'hidden',
        animation: 'fadeUp .4s ease',
      }}
    >
      {/* left: copy */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 0,
          padding: '40px 64px',
          background: '#fdf6ea',
          position: 'relative',
          zIndex: 2,
          overflowY: 'auto',
        }}
      >
        {/* the logo gives up width on short viewports so the headline keeps its size */}
        <div style={{ marginBottom: 18, flex: 'none' }}>
          <BrandLogo width="min(200px,26vh)" priority />
        </div>
        {/* Smaller than the phone headline on purpose: line one never wraps, so
            it has to survive the longest word in WORDS. */}
        <h1
          className="fredoka"
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 'clamp(34px,3.4vw,54px)',
            lineHeight: 1.04,
            color: '#372a54',
            letterSpacing: -1.2,
            textWrap: 'balance',
          }}
        >
          <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
            Send your <span style={{ color: '#ff7a2f' }}>{word}</span>
          </span>
          <span style={{ display: 'block' }}>some food.</span>
        </h1>
        <p style={{ margin: '20px 0 0', fontSize: 19, fontWeight: 700, color: '#6d5f8e' }}>100% fake · 100% free · 0 calories</p>
        <div style={{ display: 'flex', gap: 14, margin: '18px 0 22px' }}>
          {floatArt.map((d, i) => (
            <img
              key={d.id}
              src={d.low}
              alt=""
              style={{ width: 56, height: 56, objectFit: 'contain', animation: `bobD 3s ${i * 0.4}s ease-in-out infinite` }}
            />
          ))}
        </div>
        <div
          onClick={onStart}
          className="press cta"
          style={{ alignSelf: 'flex-start', background: '#ff7a2f', fontSize: 24, padding: '18px 42px' }}
        >
          Send food
        </div>
        <p style={{ margin: '20px 0 0', fontSize: 13, fontWeight: 600, color: '#a394c2', fontStyle: 'italic' }}>
          Nothing arrives. That&apos;s the whole point
        </p>
      </div>

      {/* right: sky panel */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(#8ed0f7 0%, #c8e9fb 52%, #ffedc2 78%, #ffd98f 100%)',
          borderLeft: '3px solid #372a54',
        }}
      >
        <div style={{ position: 'absolute', top: '9%', right: '12%', width: 150, height: 150, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              inset: -36,
              borderRadius: '50%',
              background: 'repeating-conic-gradient(rgba(255,209,102,.55) 0 9deg, transparent 9deg 30deg)',
              animation: 'sunSpin 24s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 18,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #ffe59a, #ffc94d)',
              border: '3px solid #372a54',
              boxShadow: '0 0 50px rgba(255,201,77,.8)',
            }}
          />
        </div>
        <div style={{ position: 'absolute', top: '16%', left: '8%', width: 120, height: 34, background: '#fff', borderRadius: 24, border: '3px solid #372a54', animation: 'driftD 9s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '34%', left: '30%', width: 84, height: 26, background: '#fff', borderRadius: 24, border: '3px solid #372a54', opacity: 0.9, animation: 'driftD 12s ease-in-out infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', top: '52%', right: '8%', width: 96, height: 28, background: '#fff', borderRadius: 24, border: '3px solid #372a54', opacity: 0.95, animation: 'driftD 13s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '12%', left: '44%', animation: 'floaty 4.5s ease-in-out infinite' }}>
          <div style={{ width: 20, height: 20, background: '#ff6f9c', border: '3px solid #372a54', borderRadius: 4 }} />
        </div>
        {/* hero drone */}
        <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)', animation: 'bobD 3.4s ease-in-out infinite' }}>
          <div style={{ position: 'relative', width: 190, height: 52 }}>
            <div style={{ position: 'absolute', top: 22, left: 0, width: 190, height: 9, background: '#372a54', borderRadius: 5 }} />
            <div style={{ position: 'absolute', top: 14, left: -16, width: 72, height: 18, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s linear infinite' }} />
            <div style={{ position: 'absolute', top: 14, right: -16, width: 72, height: 18, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s .05s linear infinite' }} />
            <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 98, height: 44, background: '#ff7a2f', border: '3.5px solid #372a54', borderRadius: 24 }} />
            <div style={{ position: 'absolute', top: 27, left: '50%', transform: 'translateX(-50%)', width: 32, height: 18, background: '#cdeafc', border: '2.5px solid #372a54', borderRadius: 7 }} />
            <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
          </div>
          <div style={{ position: 'absolute', top: 56, left: '50%', transformOrigin: 'top center', animation: 'sway 2.2s ease-in-out infinite' }}>
            <div style={{ width: 4, height: 46, background: '#372a54', marginLeft: -2 }} />
            <div style={{ position: 'relative', width: 62, height: 50, marginLeft: -31, background: '#d9915a', border: '3.5px solid #372a54', borderRadius: 9 }}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 12, height: '100%', background: '#ffc94d' }} />
            </div>
          </div>
        </div>
        {/* ground strip */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '12%', background: 'linear-gradient(#8ccb62,#6fb54a)', borderTop: '3px solid #372a54' }} />
      </div>
    </div>
  );
}
