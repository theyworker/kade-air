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

export default function Personalise({ dish, sender, recipient, message, onSender, onRecipient, onMessage, onBack, onSubmit }: Props) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      <div className="screen-head">
        <div onClick={onBack} className="press back-btn">
          ‹
        </div>
        <div className="fredoka" style={{ fontWeight: 700, fontSize: 24, color: '#372a54' }}>
          Who&apos;s eating? <span style={{ fontSize: 14, color: '#8a7ba8' }}>(not really)</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 22px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: dish.c,
            border: '2.5px solid #372a54',
            borderRadius: 18,
            padding: '12px 14px',
            boxShadow: '0 4px 0 #372a54',
          }}
        >
          <DishIcon src={dish.low} alt={dish.name} size={44} />
          <div>
            <div className="fredoka" style={{ fontWeight: 600, fontSize: 16, color: '#372a54' }}>
              {dish.name}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#372a54', opacity: 0.65 }}>{dish.blurb}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Your name</label>
          <input
            value={sender}
            onChange={(e) => onSender(e.target.value)}
            placeholder="e.g. Dinuk"
            maxLength={MAX_NAME}
            className="field-input"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">
            Their name <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <input
            value={recipient}
            onChange={(e) => onRecipient(e.target.value)}
            placeholder="e.g. Shalini"
            maxLength={MAX_NAME}
            className="field-input"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Your message</label>
          <textarea
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            placeholder="Ado, eat something no 🙄"
            rows={3}
            maxLength={MAX_MESSAGE}
            className="field-input"
            style={{ resize: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {SUGGESTIONS.map((t) => (
              <div
                key={t}
                onClick={() => onMessage(t)}
                className="press"
                style={{
                  background: message === t ? '#c8f0d8' : '#fdf6ea',
                  border: '2px solid #372a54',
                  borderRadius: 999,
                  padding: '7px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#372a54',
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
        <div onClick={onSubmit} className="press cta" style={{ marginTop: 6, background: '#17a398', fontSize: 21 }}>
          Release the drone 🚁
        </div>
      </div>
    </div>
  );
}
