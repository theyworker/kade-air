import { DISHES } from '@/lib/dishes';
import DishIcon from '../DishIcon';

export default function Menu({ onBack, onSelect }: { onBack: () => void; onSelect: (dishId: string) => void }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      <div className="screen-head">
        <div onClick={onBack} className="press back-btn">
          ‹
        </div>
        <div>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 24, color: '#372a54', lineHeight: 1.1 }}>
            Pick the item
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8a7ba8' }}>all imaginary. all delicious.</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
          {DISHES.map((d) => (
            <div
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="press"
              style={{
                background: '#fff',
                border: '2.5px solid #372a54',
                borderRadius: 20,
                padding: '14px 12px 13px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                ['--lift' as string]: '5px',
                ['--drop' as string]: '4px',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: d.c,
                  border: '2.5px solid #372a54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 5,
                }}
              >
                <DishIcon src={d.low} alt={d.name} size="100%" />
              </div>
              <div className="fredoka" style={{ fontWeight: 600, fontSize: 16, color: '#372a54', lineHeight: 1.15 }}>
                {d.name}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#8a7ba8', lineHeight: 1.35 }}>{d.blurb}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
