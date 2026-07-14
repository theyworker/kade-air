import Parcel from './Parcel';

type Props = {
  dishName: string;
  dishEmoji: string;
  ticketStamped: boolean;
  kitchenBusy: boolean;
  chefHanding: boolean;
  handoffActive: boolean;
  handoffDur: number;
};

// The kadé kitchen — left third of the scrolling world.
export default function Kitchen({ dishName, dishEmoji, ticketStamped, kitchenBusy, chefHanding, handoffActive, handoffDur }: Props) {
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '33.333%', zIndex: 2 }}>
      {/* roof strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '7%',
          background: 'repeating-linear-gradient(90deg,#e0654a 0 14px,#c94f36 14px 28px)',
          borderBottom: '3px solid #372a54',
        }}
      />
      {/* back wall */}
      <div style={{ position: 'absolute', top: '7%', left: 0, right: 0, height: '59%', background: '#fff3dd' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '34%',
            backgroundImage:
              'repeating-linear-gradient(rgba(23,163,152,.22) 0 2px, transparent 2px 26px), repeating-linear-gradient(90deg, rgba(23,163,152,.22) 0 2px, transparent 2px 26px)',
            backgroundColor: '#e7f4f0',
            borderTop: '2.5px solid #372a54',
          }}
        />
        {/* hanging sign */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 2.5, height: 92, background: '#372a54' }} />
          <div
            className="fredoka"
            style={{
              background: '#17a398',
              border: '2.5px solid #372a54',
              borderRadius: 10,
              padding: '5px 14px',
              fontWeight: 600,
              fontSize: 12,
              color: '#fff',
              letterSpacing: '.06em',
              whiteSpace: 'nowrap',
            }}
          >
            KADÉ KITCHEN · කඩේ
          </div>
        </div>
        {/* order ticket */}
        <div
          style={{
            position: 'absolute',
            top: 230,
            left: '6%',
            width: 150,
            background: '#fff',
            border: '2.5px solid #372a54',
            borderRadius: 10,
            boxShadow: '0 3px 0 #372a54',
            padding: '9px 11px',
            transform: 'rotate(-2deg)',
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#8a7ba8', letterSpacing: '.08em' }}>ORDER #8FQ2</div>
          <div className="fredoka" style={{ fontWeight: 600, fontSize: 13, color: '#372a54', marginTop: 2 }}>
            1× {dishName} {dishEmoji}
          </div>
          {ticketStamped && (
            <div
              className="fredoka"
              style={{
                position: 'absolute',
                right: -10,
                top: -10,
                background: '#e8f8ee',
                border: '2.5px solid #2fae60',
                color: '#1e7a42',
                borderRadius: 8,
                padding: '3px 8px',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '.08em',
                animation: 'stampIn .45s ease both',
              }}
            >
              ACCEPTED ✓
            </div>
          )}
        </div>
        {/* shelf + jars */}
        <div style={{ position: 'absolute', top: 120, left: '6%', width: 150 }}>
          <div style={{ position: 'absolute', top: 26, left: 0, width: '100%', height: 8, background: '#d9915a', border: '2.5px solid #372a54', borderRadius: 4 }} />
          <div style={{ position: 'absolute', top: 0, left: 10, width: 22, height: 26, background: '#ffd166', border: '2.5px solid #372a54', borderRadius: '5px 5px 3px 3px' }} />
          <div style={{ position: 'absolute', top: 4, left: 44, width: 20, height: 22, background: '#ff8a5c', border: '2.5px solid #372a54', borderRadius: '5px 5px 3px 3px' }} />
          <div style={{ position: 'absolute', top: 2, left: 76, width: 24, height: 24, background: '#8fd0a0', border: '2.5px solid #372a54', borderRadius: '5px 5px 3px 3px' }} />
          <div style={{ position: 'absolute', top: 8, left: 112, width: 16, height: 18, background: '#cdeafc', border: '2.5px solid #372a54', borderRadius: '4px 4px 3px 3px' }} />
        </div>
        {/* exit doorway (drone leaves through here) */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '19%',
            height: '72%',
            background: 'linear-gradient(#9ddaf8,#cdeafc)',
            border: '3px solid #372a54',
            borderRight: 'none',
            borderBottom: 'none',
            borderRadius: '40px 0 0 0',
          }}
        />
      </div>

      {/* counter */}
      <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: '5%', background: '#e8d9c4', borderTop: '3px solid #372a54', borderBottom: '3px solid #372a54', zIndex: 6 }} />
      <div
        style={{
          position: 'absolute',
          top: '71%',
          left: 0,
          right: 0,
          height: '14%',
          background: 'repeating-linear-gradient(90deg,#d9915a 0 46px, #cf844c 46px 92px)',
          borderBottom: '3px solid #372a54',
          zIndex: 5,
        }}
      />
      <div style={{ position: 'absolute', top: '85%', left: 0, right: 0, bottom: 0, background: '#ffe2b8', zIndex: 5 }} />

      {/* stove + pot */}
      <div style={{ position: 'absolute', left: '5%', top: '66%', width: 90, height: 0, zIndex: 7 }}>
        <div style={{ position: 'absolute', bottom: 6, left: 8, width: 70, height: 10, background: '#4a3a6b', border: '2.5px solid #372a54', borderRadius: 4 }} />
        <div style={{ position: 'absolute', bottom: 14, left: 16, width: 54, height: 32, background: '#5b4a80', border: '2.5px solid #372a54', borderRadius: '6px 6px 4px 4px' }} />
        <div style={{ position: 'absolute', bottom: 44, left: 12, width: 62, height: 10, background: '#4a3a6b', border: '2.5px solid #372a54', borderRadius: 6, animation: 'lidJig 1.1s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 52, left: 38, width: 10, height: 7, background: '#4a3a6b', border: '2px solid #372a54', borderRadius: 3, animation: 'lidJig 1.1s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 58, left: 24, width: 13, height: 13, borderRadius: '50%', background: '#fff', opacity: 0.8, animation: 'steamUp 2.2s ease-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 58, left: 42, width: 16, height: 16, borderRadius: '50%', background: '#fff', opacity: 0.8, animation: 'steamUp 2.2s .7s ease-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 58, left: 58, width: 11, height: 11, borderRadius: '50%', background: '#fff', opacity: 0.8, animation: 'steamUp 2.2s 1.4s ease-out infinite' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            left: 34,
            width: 18,
            height: 8,
            clipPath: 'polygon(50% 0,100% 100%,0 100%)',
            background: '#ff8a2f',
            animation: 'flick .5s ease-in-out infinite',
            transformOrigin: 'bottom',
          }}
        />
      </div>

      {/* chopping board + kottu + cleavers */}
      <div style={{ position: 'absolute', left: '44%', top: '66%', width: 110, height: 0, zIndex: 7 }}>
        <div style={{ position: 'absolute', bottom: 4, left: 0, width: 104, height: 12, background: '#c98a4b', border: '2.5px solid #372a54', borderRadius: 6 }} />
        <div style={{ position: 'absolute', bottom: 14, left: 16, width: 18, height: 7, background: '#ffd166', border: '2px solid #372a54', borderRadius: 4, transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'absolute', bottom: 15, left: 38, width: 20, height: 7, background: '#ff8a5c', border: '2px solid #372a54', borderRadius: 4, transform: 'rotate(6deg)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 62, width: 17, height: 7, background: '#8fd0a0', border: '2px solid #372a54', borderRadius: 4, transform: 'rotate(-5deg)' }} />
        {kitchenBusy && (
          <>
            <div style={{ position: 'absolute', bottom: 22, left: 14, transformOrigin: 'bottom right', animation: 'chopL .32s ease-in-out infinite' }}>
              <div style={{ width: 26, height: 20, background: '#cdd8e4', border: '2.5px solid #372a54', borderRadius: '4px 4px 8px 4px' }} />
              <div style={{ position: 'absolute', top: -10, left: 16, width: 20, height: 7, background: '#8a5a3b', border: '2px solid #372a54', borderRadius: 4, transform: 'rotate(-30deg)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 22, left: 56, transformOrigin: 'bottom left', animation: 'chopR .32s ease-in-out infinite' }}>
              <div style={{ width: 26, height: 20, background: '#cdd8e4', border: '2.5px solid #372a54', borderRadius: '4px 4px 4px 8px' }} />
              <div style={{ position: 'absolute', top: -10, left: -8, width: 20, height: 7, background: '#8a5a3b', border: '2px solid #372a54', borderRadius: 4, transform: 'rotate(30deg)' }} />
            </div>
          </>
        )}
      </div>

      {/* CHEF */}
      <div style={{ position: 'absolute', left: '22%', top: '66%', width: 110, height: 0, zIndex: 6 }}>
        <div style={{ position: 'absolute', bottom: -6, left: 14, width: 76, height: 86, background: '#fff', border: '3px solid #372a54', borderRadius: '22px 22px 10px 10px' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 26, width: 52, height: 52, background: '#17a398', border: '2.5px solid #372a54', borderRadius: '8px 8px 6px 6px' }} />
        <div style={{ position: 'absolute', bottom: 64, left: 48, width: 6, height: 6, borderRadius: '50%', background: '#372a54' }} />
        <div style={{ position: 'absolute', bottom: 52, left: 48, width: 6, height: 6, borderRadius: '50%', background: '#372a54' }} />
        <div style={{ position: 'absolute', bottom: 74, left: 30, width: 44, height: 42, background: '#c67a4a', border: '3px solid #372a54', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 92, left: 42, width: 5, height: 5, borderRadius: '50%', background: '#372a54' }} />
        <div style={{ position: 'absolute', bottom: 92, left: 58, width: 5, height: 5, borderRadius: '50%', background: '#372a54' }} />
        <div style={{ position: 'absolute', bottom: 84, left: 44, width: 18, height: 6, background: '#372a54', borderRadius: 4 }} />
        <div style={{ position: 'absolute', bottom: 110, left: 28, width: 48, height: 26, background: '#fff', border: '3px solid #372a54', borderRadius: '14px 14px 4px 4px' }} />
        <div style={{ position: 'absolute', bottom: 132, left: 34, width: 14, height: 14, background: '#fff', border: '2.5px solid #372a54', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 134, left: 46, width: 15, height: 15, background: '#fff', border: '2.5px solid #372a54', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 132, left: 58, width: 13, height: 13, background: '#fff', border: '2.5px solid #372a54', borderRadius: '50%' }} />
        {/* stirring / handing arm */}
        {kitchenBusy && (
          <div style={{ position: 'absolute', bottom: 34, left: 82, width: 46, height: 13, background: '#fff', border: '2.5px solid #372a54', borderRadius: 8, transformOrigin: 'left center', animation: 'stir .5s ease-in-out infinite' }} />
        )}
        {chefHanding && (
          <div style={{ position: 'absolute', bottom: 44, left: 82, width: 52, height: 13, background: '#fff', border: '2.5px solid #372a54', borderRadius: 8, transformOrigin: 'left center', transform: 'rotate(-14deg)' }} />
        )}
      </div>

      {/* handoff parcel (chef -> pad) */}
      {handoffActive && (
        <div style={{ position: 'absolute', left: '31%', top: '60.5%', zIndex: 8, animation: `handoff ${handoffDur}s cubic-bezier(.4,-.2,.5,1) forwards` }}>
          <Parcel />
        </div>
      )}

      {/* launch pad */}
      <div style={{ position: 'absolute', right: '5%', top: '66%', width: 74, height: 0, zIndex: 7 }}>
        <div style={{ position: 'absolute', bottom: 2, left: 0, width: 74, height: 10, background: '#ffd166', border: '2.5px solid #372a54', borderRadius: 6 }} />
        <div style={{ position: 'absolute', bottom: 12, left: 22, width: 30, height: 14, border: '2.5px dashed #372a54', borderRadius: '50%', opacity: 0.55 }} />
      </div>

      {/* building corner edge (seam treatment) */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, background: '#e8d9c4', borderLeft: '3px solid #372a54', zIndex: 9 }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 8, width: 7, background: '#c9b394', borderLeft: '2px solid #372a54', borderRight: '2px solid #372a54' }} />
        <div
          style={{
            position: 'absolute',
            top: '7%',
            left: 0,
            right: 0,
            height: 8,
            background: 'repeating-linear-gradient(90deg,#e0654a 0 7px,#c94f36 7px 14px)',
            borderTop: '2.5px solid #372a54',
            borderBottom: '2.5px solid #372a54',
          }}
        />
      </div>
    </div>
  );
}
