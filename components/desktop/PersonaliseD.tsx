'use client';

import type { Dish } from '@/lib/dishes';
import DishIcon from '../DishIcon';
import MessagePicker from '../MessagePicker';
import RequiredDialog from '../RequiredDialog';
import { MAX_MESSAGE, MAX_NAME } from '@/lib/order';
import { useRequiredFields } from '@/lib/useRequiredFields';

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

export default function PersonaliseD({
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
  const required = useRequiredFields({ sender, recipient, message }, onSubmit);
  const fieldClass = (value: string) => `field-input${required.invalid(value) ? ' invalid' : ''}`;

  return (
    <div style={{ minHeight: '100vh', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      {required.showErrors && <RequiredDialog missing={required.missing} onDismiss={required.dismiss} variant="desktop" />}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>Your name</label>
              <input
                value={sender}
                onChange={(e) => onSender(e.target.value)}
                placeholder="e.g. Susantha"
                maxLength={MAX_NAME}
                required
                aria-invalid={required.invalid(sender)}
                className={fieldClass(sender)}
                style={{ padding: '15px 16px', fontSize: 17 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>Their name</label>
              <input
                value={recipient}
                onChange={(e) => onRecipient(e.target.value)}
                placeholder="e.g. Susanthi"
                maxLength={MAX_NAME}
                required
                aria-invalid={required.invalid(recipient)}
                className={fieldClass(recipient)}
                style={{ padding: '15px 16px', fontSize: 17 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label className="field-label" style={{ fontSize: 13 }}>Your message</label>
              <textarea
                value={message}
                onChange={(e) => onMessage(e.target.value)}
                placeholder="Bada Pirenna Kanna"
                rows={3}
                maxLength={MAX_MESSAGE}
                required
                aria-invalid={required.invalid(message)}
                className={fieldClass(message)}
                style={{ padding: '15px 16px', fontSize: 17, resize: 'none' }}
              />
              <div className="field-label" style={{ fontSize: 12, letterSpacing: '.06em', marginTop: 8 }}>
                Quick Messages
              </div>
              <MessagePicker message={message} onPick={onMessage} height="clamp(150px,32vh,320px)" variant="desktop" />
            </div>
            {/* rides along the bottom of the viewport while the deck is being browsed */}
            {submitError && (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#c2410c', marginTop: 8 }}>
                {submitError === 'rate_limited'
                  ? 'Ayyo. Kade uncle needs a break — try again in a bit.'
                  : 'Ayyo. The drone never took off. Give it another go.'}
              </div>
            )}
            <div
              onClick={submitting ? undefined : required.submit}
              className="press cta"
              style={{
                position: 'sticky',
                bottom: 24,
                marginTop: 8,
                flex: 'none',
                background: submitting ? '#8ab5b1' : '#17a398',
                fontSize: 22,
                padding: 18,
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Warming up the drone…' : 'Release the drone'}
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
              alignSelf: 'start',
            }}
          >
            <DishIcon src={dish.high} alt={dish.name} size={150} style={{ animation: 'bobD 3s ease-in-out infinite' }} />
            <div className="fredoka" style={{ fontWeight: 700, fontSize: 26, color: '#372a54', lineHeight: 1.15 }}>
              {dish.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 6 }}>
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
                }}
              >
                ORDER #8FQ2
              </div>
              <div className="fredoka" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1, color: '#17a398', letterSpacing: '-.5px' }}>
                Rs. 0.00
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
