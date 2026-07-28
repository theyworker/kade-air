import type { Dish } from '@/lib/dishes';
import DishIcon from '../DishIcon';

type Props = {
  dish: Dish;
  senderDisplay: string;
  recipientDisplay: string;
  chainNumber: number;
  onSendAgain: () => void;
  onReplay: () => void;
};

export default function Loop({ dish, senderDisplay, recipientDisplay, chainNumber, onSendAgain, onReplay }: Props) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 30px',
        background: 'linear-gradient(#ffd98f, #ff9f5c 70%, #ff8a5c)',
        animation: 'fadeUp .4s ease',
        gap: 18,
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#fff',
          border: '3px solid #372a54',
          borderRadius: 26,
          boxShadow: '0 7px 0 #372a54',
          padding: '26px 22px',
          textAlign: 'center',
          animation: 'popIn .5s ease both',
        }}
      >
        <DishIcon src={dish.low} alt={dish.name} size={96} style={{ margin: '0 auto', animation: 'bob 3s ease-in-out infinite' }} />
        <div className="fredoka" style={{ marginTop: 10, fontWeight: 700, fontSize: 30, color: '#372a54', lineHeight: 1.05 }}>
          FED!
          <br />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#8a7ba8' }}>(emotionally)</span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 700, color: '#6d5f8e', lineHeight: 1.45 }}>
          {senderDisplay} just fed {recipientDisplay} one imaginary {dish.name}. Zero rupees. Zero regrets.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            background: '#fdf6ea',
            border: '2.5px solid #372a54',
            borderRadius: 999,
            padding: '9px 18px',
          }}
        >
          <span style={{ fontSize: 15 }}>🔗</span>
          <span className="fredoka" style={{ fontWeight: 600, fontSize: 14, color: '#372a54' }}>
            You&apos;re #{chainNumber} in this food chain
          </span>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 11, fontWeight: 700, color: '#a394c2', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          kade air · nothing arrives, on purpose
        </p>
      </div>
      <div onClick={onSendAgain} className="press cta" style={{ width: '100%', background: '#17a398', fontSize: 20 }}>
        Now YOU send food to a friend
      </div>
      <div onClick={onReplay} style={{ fontSize: 13, fontWeight: 700, color: '#7a3b1e', cursor: 'pointer', textDecoration: 'underline' }}>
        watch the drone again
      </div>
    </div>
  );
}
