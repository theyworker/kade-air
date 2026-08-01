import type { Dish } from '@/lib/dishes';
import DishIcon from '../DishIcon';
import MessagePicker from '../MessagePicker';
import { MAX_MESSAGE, MAX_NAME } from '@/lib/order';

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
  submitting?: boolean;
  submitError?: 'rate_limited' | 'failed' | null;
};

export default function Personalise({
  dish,
  sender,
  recipient,
  message,
  onSender,
  onRecipient,
  onMessage,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: Props) {
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
            placeholder="e.g. Susantha"
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
            placeholder="e.g. Susanthi"
            maxLength={MAX_NAME}
            className="field-input"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="field-label">Your message</label>
          <textarea
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            placeholder="Bada Pirenna Kanna"
            rows={3}
            maxLength={MAX_MESSAGE}
            className="field-input"
            style={{ resize: 'none' }}
          />
          <div className="field-label" style={{ fontSize: 11, marginTop: 8 }}>
            Quick messages <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>· tap to use</span>
          </div>
          {/* Sized off the live viewport (dvh follows the mobile URL bar), so on a
              short phone the deck stays a strip rather than swallowing the form. */}
          <MessagePicker message={message} onPick={onMessage} height="clamp(112px, 26dvh, 236px)" />
        </div>
      </div>
      <div style={{ flex: 'none', padding: '12px 22px 26px', background: '#fdf6ea' }}>
        {submitError && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 10, textAlign: 'center' }}>
            {submitError === 'rate_limited'
              ? 'Ayyo. Kade uncle needs a break — try again in a bit.'
              : 'Ayyo. The drone never took off. Give it another go.'}
          </div>
        )}
        <div
          onClick={submitting ? undefined : onSubmit}
          className="press cta"
          style={{
            background: submitting ? '#8ab5b1' : '#17a398',
            fontSize: 21,
            padding: 17,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Warming up the drone…' : 'Release the drone'}
        </div>
      </div>
    </div>
  );
}
