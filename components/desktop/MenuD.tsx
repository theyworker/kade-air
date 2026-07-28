import { DISHES } from '@/lib/dishes';
import DishIcon from '../DishIcon';

export default function MenuD({ onBack, onSelect }: { onBack: () => void; onSelect: (dishId: string) => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div onClick={onBack} className="press back-btn" style={{ width: 46, height: 46, borderRadius: 14, fontSize: 22, flex: 'none' }}>
            ‹
          </div>
          <div>
            <div className="fredoka" style={{ fontWeight: 700, fontSize: 36, color: '#372a54', lineHeight: 1.1 }}>
              Pick the parcel
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8a7ba8' }}>all imaginary. all delicious.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(196px,1fr))', gap: 18 }}>
          {DISHES.map((d) => (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="press card-hover"
              style={{
                background: '#fff',
                border: '2.5px solid #372a54',
                borderRadius: 22,
                padding: '18px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                ['--lift' as string]: '5px',
                ['--drop' as string]: '4px',
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: '50%',
                  background: d.c,
                  border: '2.5px solid #372a54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 6,
                }}
              >
                <DishIcon src={d.low} alt={d.name} size="100%" />
              </div>
              <div className="fredoka" style={{ fontWeight: 600, fontSize: 18, color: '#372a54', lineHeight: 1.15 }}>
                {d.name}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8a7ba8', lineHeight: 1.35 }}>{d.blurb}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
