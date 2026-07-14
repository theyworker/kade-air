export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(#8ed0f7 0%, #c8e9fb 46%, #ffedc2 72%, #fdf6ea 100%)',
        animation: 'fadeUp .4s ease',
      }}
    >
      <div style={{ position: 'absolute', top: 70, right: 34, width: 110, height: 110, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            inset: -26,
            borderRadius: '50%',
            background: 'repeating-conic-gradient(rgba(255,209,102,.55) 0 9deg, transparent 9deg 30deg)',
            animation: 'sunSpin 24s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #ffe59a, #ffc94d)',
            border: '3px solid #372a54',
            boxShadow: '0 0 40px rgba(255,201,77,.8)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 26,
          width: 78,
          height: 24,
          background: '#fff',
          borderRadius: 20,
          border: '2.5px solid #372a54',
          animation: 'drift 9s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 225,
          left: 120,
          width: 56,
          height: 19,
          background: '#fff',
          borderRadius: 20,
          border: '2.5px solid #372a54',
          opacity: 0.9,
          animation: 'drift 12s ease-in-out infinite alternate-reverse',
        }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 26px 26px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#ff7a2f',
              border: '3px solid #372a54',
              boxShadow: '0 4px 0 #372a54',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🚁
          </div>
          <div>
            <div className="fredoka" style={{ fontWeight: 700, fontSize: 26, color: '#372a54', lineHeight: 1, letterSpacing: -0.5 }}>
              KADE AIR
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8a7ba8', letterSpacing: '.14em', textTransform: 'uppercase' }}>
              drone-ish deliveries
            </div>
          </div>
        </div>
        <h1 className="fredoka" style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 46, lineHeight: 1.04, color: '#372a54', letterSpacing: -1 }}>
          Send your machan some food.
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 16, fontWeight: 700, color: '#6d5f8e' }}>100% fake · 100% free · 0% calories</p>
        <div style={{ display: 'flex', gap: 10, margin: '20px 0 26px' }}>
          {['🥘', '🍳', '🍮', '🍕', '🧋'].map((e, i) => (
            <div key={e} style={{ fontSize: 26, animation: `bob 3s ${i * 0.4}s ease-in-out infinite` }}>
              {e}
            </div>
          ))}
        </div>
        <div
          onClick={onStart}
          className="press cta"
          style={{ background: '#ff7a2f', fontSize: 22, padding: 18 }}
        >
          Ado, send food →
        </div>
        <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 12, fontWeight: 600, color: '#a394c2', fontStyle: 'italic' }}>
          nothing arrives. that&apos;s the whole point.
        </p>
      </div>
    </div>
  );
}
