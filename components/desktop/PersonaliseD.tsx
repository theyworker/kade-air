import type { Dish } from '@/lib/dishes';
import DishIcon from '../DishIcon';
import { MAX_MESSAGE, MAX_NAME } from '@/lib/order';

const SUGGESTIONS = [
  'Ado, eat something no 🙄',
  'Miss you machan. eat well 💛',
  'Stop skipping lunch, I can see you 👀',
];

type Props = {
  dish: Dish;
  sender: string;
  recipient: string;
  message: string;
  onSender: (v: string) => void;
  onRecipient: (v: string) => void;
  onMessage: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export default function PersonaliseD({ dish, sender, recipient, message, onSender, onRecipient, onMessage, onBack, onSubmit }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 40px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
          <div onClick={onBack} className="press back-btn" style={{ width: 46, height: 46, borderRadius: 14, fontSize: 22, flex: 'none' }}>
            ‹
          </div>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 36, color: '#372a54' }}>
            Who&apos;s eating? <span style={{ fontSize: 18, color: '#8a7ba8' }}>(not really)</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 36, alignItems: 'start' }}>
          {/* form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>Your name</label>
              <input
                value={sender}
                onChange={(e) => onSender(e.target.value)}
                placeholder="e.g. Dinuk"
                maxLength={MAX_NAME}
                className="field-input"
                style={{ padding: '15px 16px', fontSize: 17 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>
                Their name <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                value={recipient}
                onChange={(e) => onRecipient(e.target.value)}
                placeholder="e.g. Shalini"
                maxLength={MAX_NAME}
                className="field-input"
                style={{ padding: '15px 16px', fontSize: 17 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>Your message</label>
              <textarea
                value={message}
                onChange={(e) => onMessage(e.target.value)}
                placeholder="Ado, eat something no 🙄"
                rows={3}
                maxLength={MAX_MESSAGE}
                className="field-input"
                style={{ padding: '15px 16px', fontSize: 17, resize: 'none' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 6 }}>
                {SUGGESTIONS.map((t) => (
                  <div
                    key={t}
                    onClick={() => onMessage(t)}
                    className="press"
                    style={{
                      background: message === t ? '#c8f0d8' : '#fdf6ea',
                      border: '2px solid #372a54',
                      borderRadius: 999,
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#372a54',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.5,
                      ['--lift' as string]: '2px',
                      ['--drop' as string]: '2px',
                      ['--rest' as string]: '0',
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div onClick={onSubmit} className="press cta" style={{ marginTop: 8, background: '#17a398', fontSize: 22, padding: 18 }}>
              Release the drone 🚁
            </div>
          </div>
          {/* dish preview */}
          <div
            style={{
              background: dish.c,
              border: '3px solid #372a54',
              borderRadius: 26,
              boxShadow: '0 6px 0 #372a54',
              padding: '34px 26px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 12,
              position: 'sticky',
              top: 32,
            }}
          >
            <DishIcon src={dish.low} alt={dish.name} size={104} style={{ animation: 'bobD 3s ease-in-out infinite' }} />
            <div className="fredoka" style={{ fontWeight: 700, fontSize: 26, color: '#372a54', lineHeight: 1.15 }}>
              {dish.name}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#372a54', opacity: 0.65 }}>{dish.blurb}</div>
            <div
              style={{
                background: '#fff',
                border: '2px solid #372a54',
                borderRadius: 999,
                padding: '7px 16px',
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 700,
                color: '#6d5f8e',
                marginTop: 6,
              }}
            >
              ORDER #8FQ2 · Rs. 0.00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
