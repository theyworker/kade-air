import type { Dish } from '@/lib/dishes';

type Props = {
  dish: Dish;
  senderDisplay: string;
  recipientDisplay: string;
  /** the sender's note — desktop has no separate reveal card, so it lands here */
  msgDisplay?: string;
  onSendAgain: () => void;
  onReplay: () => void;
};

// Desktop's end card doubles as the reveal: the dish fills half the screen
// while the note and the hand-off sit in the right column.
export default function LoopD({ dish, senderDisplay, recipientDisplay, msgDisplay, onSendAgain, onReplay }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        background: 'linear-gradient(#ffd98f, #ff9f5c 70%, #ff8a5c)',
        animation: 'fadeUp .4s ease',
        gap: 20,
      }}
    >
      <div
        style={{
          width: 'min(1180px,94vw)',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px,44%) 1fr',
          gap: 'clamp(32px,5vw,72px)',
          alignItems: 'center',
          animation: 'popIn .5s ease both',
        }}
      >
        <img
          src={dish.high}
          alt={dish.name}
          decoding="sync"
          fetchPriority="high"
          style={{
            width: '100%',
            aspectRatio: '1',
            objectFit: 'contain',
            filter: 'drop-shadow(0 22px 34px rgba(55,42,84,.28))',
            animation: 'bobD 3.4s ease-in-out infinite',
          }}
        />
        <div style={{ textAlign: 'left' }}>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 'clamp(64px,9vw,132px)', lineHeight: 0.92, color: '#372a54', letterSpacing: -2 }}>
            FED!
          </div>
          <div className="fredoka" style={{ marginTop: 6, fontWeight: 600, fontSize: 'clamp(20px,2vw,28px)', color: '#7a3b1e' }}>
            (emotionally)
          </div>
          <p
            style={{
              margin: '22px 0 0',
              fontSize: 'clamp(19px,1.9vw,26px)',
              fontWeight: 700,
              color: '#4a3a6b',
              lineHeight: 1.4,
              maxWidth: '22ch',
              textWrap: 'pretty',
            }}
          >
            {senderDisplay} just &ldquo;fed&rdquo; {recipientDisplay} one imaginary {dish.name}.
            <br />
            <span style={{ whiteSpace: 'nowrap' }}>Zero rupees. Zero regrets.</span>
          </p>
          {msgDisplay && (
            <p
              className="fredoka"
              style={{
                margin: '24px 0 0',
                fontSize: 'clamp(22px,2.4vw,34px)',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-.5px',
                color: '#372a54',
                maxWidth: '20ch',
                textWrap: 'pretty',
              }}
            >
              &ldquo;{msgDisplay}&rdquo;
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, marginTop: 30 }}>
            <div onClick={onSendAgain} className="press cta" style={{ background: '#17a398', fontSize: 21, padding: '18px 30px' }}>
              Send an imaginary snack
            </div>
          </div>
          <p style={{ margin: '28px 0 0', fontSize: 12, fontWeight: 700, color: '#8a4f2e', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Air Kade · nothing arrives, on purpose
          </p>
        </div>
      </div>
      <div
        onClick={onReplay}
        style={{ marginTop: 'auto', paddingTop: 28, fontSize: 15, fontWeight: 700, color: '#7a3b1e', cursor: 'pointer', textDecoration: 'underline' }}
      >
        watch the drone again
      </div>
    </div>
  );
}
