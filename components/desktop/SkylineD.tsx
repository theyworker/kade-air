import DishIcon from '@/components/DishIcon';
import Parcel from '@/components/track/Parcel';

type Props = {
  padActive: boolean;
  landed: boolean;
  dishIcon: string;
  dishName: string;
  showTuk: boolean;
};

// Colombo skyline at desktop scale — landmarks are the mobile art scaled
// 2x via transforms, spread across viewports 2-3 of the world.
export default function SkylineD({ padActive, landed, dishIcon, dishName, showTuk }: Props) {
  return (
    <div style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: '66.667%', zIndex: 2 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '35%', height: '34%', background: 'linear-gradient(transparent, rgba(255,255,255,.75))' }} />

      {/* zIndex keeps the label pills above the Galle Face green below */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '35%', height: 0, zIndex: 3 }}>
        {/* Fort Railway Station */}
        <div style={{ position: 'absolute', bottom: 0, left: '1%', width: 68, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 52, left: '50%', transform: 'translateX(-50%)', width: 30, height: 16, background: '#fff3dd', border: '2.5px solid #372a54', borderBottom: 'none', borderRadius: '15px 15px 0 0' }}>
            <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 9, height: 9, borderRadius: '50%', background: '#fff', border: '2px solid #372a54' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 68, height: 54, background: '#fff3dd', border: '2.5px solid #372a54', borderRadius: '5px 5px 0 0' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 7, width: 12, height: 26, background: '#9ddaf8', border: '2px solid #372a54', borderBottom: 'none', borderRadius: '7px 7px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 26, width: 12, height: 26, background: '#9ddaf8', border: '2px solid #372a54', borderBottom: 'none', borderRadius: '7px 7px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 45, width: 12, height: 26, background: '#9ddaf8', border: '2px solid #372a54', borderBottom: 'none', borderRadius: '7px 7px 0 0' }} />
          </div>
          <div className="lm-label" style={{ bottom: -28 }}>FORT STATION</div>
        </div>

        {/* Clock Tower */}
        <div style={{ position: 'absolute', bottom: 0, left: '10.5%', width: 20, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 20, height: 98, background: '#fff', border: '2.5px solid #372a54', borderRadius: '4px 4px 0 0' }}>
            <div style={{ position: 'absolute', top: 24, left: -2.5, right: -2.5, height: 10, background: '#e0654a', border: '2.5px solid #372a54' }} />
            <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: '#ffd166', border: '2px solid #372a54' }} />
          </div>
          <div className="lm-label" style={{ bottom: -50 }}>CLOCK TOWER</div>
        </div>

        {/* WTC twins */}
        <div style={{ position: 'absolute', bottom: 0, left: '14.5%', width: 64, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          {[0, 36].map((off) => (
            <div
              key={off}
              style={{
                position: 'absolute',
                bottom: 0,
                left: off,
                width: 28,
                height: 158,
                backgroundColor: '#cdeafc',
                backgroundImage:
                  'repeating-linear-gradient(rgba(55,42,84,.15) 0 2px, transparent 2px 12px),repeating-linear-gradient(90deg, rgba(55,42,84,.15) 0 2px, transparent 2px 9px)',
                border: '2.5px solid #372a54',
                borderRadius: '3px 3px 0 0',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 9, background: '#8ed0f7', borderBottom: '2px solid #372a54' }} />
            </div>
          ))}
          <div className="lm-label" style={{ bottom: -28 }}>WTC</div>
        </div>

        {/* BOC tower */}
        <div style={{ position: 'absolute', bottom: 0, left: '23.5%', width: 42, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 42,
              height: 132,
              backgroundColor: '#fff3dd',
              backgroundImage: 'repeating-linear-gradient(rgba(55,42,84,.14) 0 2px, transparent 2px 11px)',
              border: '2.5px solid #372a54',
              borderRadius: '21px 21px 0 0',
            }}
          >
            <div
              className="fredoka"
              style={{
                position: 'absolute',
                top: 16,
                left: 0,
                right: 0,
                height: 12,
                background: '#4a3a6b',
                borderTop: '2px solid #372a54',
                borderBottom: '2px solid #372a54',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 7,
                letterSpacing: '.12em',
                color: '#ffd166',
              }}
            >
              BOC
            </div>
          </div>
          <div className="lm-label" style={{ bottom: -50 }}>BOC</div>
        </div>

        {/* Old Parliament */}
        <div style={{ position: 'absolute', bottom: 0, left: '30.5%', width: 62, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', width: 34, height: 12, clipPath: 'polygon(50% 0,100% 100%,0 100%)', background: '#d9915a' }} />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 62,
              height: 44,
              backgroundColor: '#fff3dd',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(55,42,84,.22) 0 3px, transparent 3px 11px)',
              border: '2.5px solid #372a54',
              borderRadius: '4px 4px 0 0',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 11, background: '#e8d9c4', borderBottom: '2px solid #372a54' }} />
          </div>
          <div className="lm-label" style={{ bottom: -28 }}>OLD PARLIAMENT</div>
        </div>

        {/* Lotus Tower */}
        <div style={{ position: 'absolute', bottom: 0, left: '40%', width: 44, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 13, height: 150, background: '#4ea34e', border: '2.5px solid #372a54', borderRadius: '5px 5px 3px 3px' }} />
          <div style={{ position: 'absolute', bottom: 146, left: '50%', transform: 'translateX(-50%)', width: 36, height: 42, background: '#ff6f9c', border: '2.5px solid #372a54', borderRadius: '50% 50% 42% 42%' }}>
            <div style={{ position: 'absolute', top: 8, left: 7, width: 9, height: 12, borderRadius: '50%', background: '#ffd0e2' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 186, left: '50%', transform: 'translateX(-50%)', width: 3.5, height: 32, background: '#372a54', borderRadius: 2 }} />
          <div className="lm-label" style={{ bottom: -50 }}>LOTUS TOWER</div>
        </div>

        {/* One Galle Face */}
        <div style={{ position: 'absolute', bottom: 0, left: '47.5%', width: 44, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 150, left: 0, width: 44, height: 14, clipPath: 'polygon(0 100%,100% 0,100% 100%)', background: '#4a3a6b' }} />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 44,
              height: 150,
              backgroundColor: '#a9ddf5',
              backgroundImage:
                'repeating-linear-gradient(rgba(55,42,84,.15) 0 2px, transparent 2px 11px),repeating-linear-gradient(90deg, rgba(55,42,84,.12) 0 2px, transparent 2px 12px)',
              border: '2.5px solid #372a54',
            }}
          >
            <div className="fredoka" style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontWeight: 600, fontSize: 7, letterSpacing: '.1em', color: '#372a54' }}>
              OGF
            </div>
          </div>
          <div className="lm-label" style={{ bottom: -28 }}>OGF</div>
        </div>

        {/* Shangri-La */}
        <div style={{ position: 'absolute', bottom: 0, left: '54%', width: 44, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 44,
              height: 140,
              backgroundColor: '#e9e2d2',
              backgroundImage: 'repeating-linear-gradient(rgba(55,42,84,.16) 0 2px, transparent 2px 9px)',
              border: '2.5px solid #372a54',
              borderRadius: '3px 3px 0 0',
            }}
          >
            <div style={{ position: 'absolute', top: 10, bottom: 0, right: 8, width: 9, background: '#fff', borderLeft: '2px solid #372a54', borderRight: '2px solid #372a54' }} />
            <div
              className="fredoka"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 10,
                background: '#c9b394',
                borderBottom: '2px solid #372a54',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 5.5,
                letterSpacing: '.08em',
                color: '#372a54',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              SHANGRI-LA
            </div>
          </div>
          <div className="lm-label" style={{ bottom: -50 }}>SHANGRI-LA</div>
        </div>

        {/* Colombo City Centre */}
        <div style={{ position: 'absolute', bottom: 0, left: '60.5%', width: 34, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 168, left: '50%', transform: 'translateX(-50%)', width: 14, height: 9, background: '#2fae60', border: '2px solid #372a54', borderRadius: 3 }} />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 34,
              height: 168,
              backgroundColor: '#bfe4f9',
              backgroundImage: 'repeating-linear-gradient(rgba(55,42,84,.15) 0 2px, transparent 2px 10px)',
              border: '2.5px solid #372a54',
              borderRadius: '4px 4px 0 0',
            }}
          />
          <div className="lm-label" style={{ bottom: -28 }}>CCC</div>
        </div>

        {/* Cinnamon Life */}
        <div style={{ position: 'absolute', bottom: 0, left: '66%', width: 50, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 2,
              width: 20,
              height: 118,
              backgroundColor: '#f3ede0',
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(55,42,84,.2) 0 2px, transparent 2px 9px),repeating-linear-gradient(-45deg, rgba(55,42,84,.2) 0 2px, transparent 2px 9px)',
              border: '2.5px solid #372a54',
              transform: 'skewX(-12deg)',
              transformOrigin: 'bottom left',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 26,
              width: 22,
              height: 160,
              backgroundColor: '#dfe8f2',
              backgroundImage:
                'repeating-linear-gradient(rgba(55,42,84,.15) 0 2px, transparent 2px 9px),repeating-linear-gradient(90deg, rgba(55,42,84,.12) 0 2px, transparent 2px 8px)',
              border: '2.5px solid #372a54',
              borderRadius: '3px 3px 0 0',
            }}
          />
          <div style={{ position: 'absolute', bottom: 108, left: 12, width: 18, height: 7, background: '#fff', border: '2px solid #372a54' }} />
          <div className="lm-label" style={{ bottom: -50 }}>ALTAIR</div>
        </div>

        {/* Altair */}
        <div style={{ position: 'absolute', bottom: 0, left: '73%', width: 48, transform: 'scale(2)', transformOrigin: 'bottom left' }}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 14,
              width: 20,
              height: 172,
              backgroundColor: '#dde6f4',
              backgroundImage:
                'repeating-linear-gradient(rgba(55,42,84,.16) 0 2px, transparent 2px 8px),repeating-linear-gradient(90deg, rgba(55,42,84,.12) 0 2px, transparent 2px 8px)',
              border: '2.5px solid #372a54',
              borderRadius: '3px 3px 0 0',
            }}
          />
        </div>
      </div>

      {/* Galle Face green */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '16%', height: '19%', background: 'linear-gradient(#8ccb62,#6fb54a)', borderTop: '3px solid #372a54' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: '#e8d9c4', borderTop: '2.5px solid #372a54' }} />
        {/* palms */}
        <div style={{ position: 'absolute', left: '8%', bottom: 26, width: 44, height: 58, transform: 'scale(1.8)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 19, width: 6, height: 36, background: '#8a5a3b', border: '2px solid #372a54', borderRadius: 3, transform: 'rotate(4deg)' }} />
          <div style={{ position: 'absolute', bottom: 32, left: 0, width: 26, height: 9, borderRadius: '50%', background: '#4ea34e', border: '2px solid #372a54', transform: 'rotate(-24deg)' }} />
          <div style={{ position: 'absolute', bottom: 34, left: 18, width: 26, height: 9, borderRadius: '50%', background: '#5cb35c', border: '2px solid #372a54', transform: 'rotate(20deg)' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 8, width: 26, height: 9, borderRadius: '50%', background: '#4ea34e', border: '2px solid #372a54', transform: 'rotate(-4deg)' }} />
        </div>
        <div style={{ position: 'absolute', left: '30%', bottom: 26, width: 38, height: 48, transform: 'scale(1.5)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 16, width: 6, height: 32, background: '#8a5a3b', border: '2px solid #372a54', borderRadius: 3, transform: 'rotate(-5deg)' }} />
          <div style={{ position: 'absolute', bottom: 28, left: -2, width: 24, height: 9, borderRadius: '50%', background: '#4ea34e', border: '2px solid #372a54', transform: 'rotate(-22deg)' }} />
          <div style={{ position: 'absolute', bottom: 30, left: 15, width: 24, height: 9, borderRadius: '50%', background: '#5cb35c', border: '2px solid #372a54', transform: 'rotate(18deg)' }} />
        </div>
        <div style={{ position: 'absolute', left: '52%', bottom: 26, width: 38, height: 48, transform: 'scale(1.7)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 16, width: 6, height: 32, background: '#8a5a3b', border: '2px solid #372a54', borderRadius: 3, transform: 'rotate(5deg)' }} />
          <div style={{ position: 'absolute', bottom: 28, left: -2, width: 24, height: 9, borderRadius: '50%', background: '#4ea34e', border: '2px solid #372a54', transform: 'rotate(-20deg)' }} />
          <div style={{ position: 'absolute', bottom: 30, left: 15, width: 24, height: 9, borderRadius: '50%', background: '#5cb35c', border: '2px solid #372a54', transform: 'rotate(22deg)' }} />
        </div>

        {/* DOORSTEP (landing target) */}
        <div style={{ position: 'absolute', left: '85%', bottom: 26, width: 104, height: 86, transform: 'scale(1.8)', transformOrigin: 'bottom left' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 8, width: 88, height: 56, background: '#fff3dd', border: '2.5px solid #372a54', borderRadius: 4 }} />
          <div
            style={{
              position: 'absolute',
              bottom: 54,
              left: 0,
              width: 104,
              height: 22,
              clipPath: 'polygon(50% 0,100% 100%,0 100%)',
              background: 'repeating-linear-gradient(90deg,#e0654a 0 5px,#c94f36 5px 10px)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 38, width: 26, height: 34, background: '#17a398', border: '2.5px solid #372a54', borderRadius: '4px 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 57, width: 4, height: 4, borderRadius: '50%', background: '#ffc94d' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 14, height: 14, background: '#cdeafc', border: '2px solid #372a54' }} />
          {padActive && (
            <div
              style={{
                position: 'absolute',
                bottom: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 60,
                height: 16,
                border: '2.5px dashed #372a54',
                borderRadius: '50%',
                animation: 'padPulse 1.2s ease-out infinite',
              }}
            />
          )}
          {landed && (
            <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', animation: 'popIn .5s ease both' }}>
              <Parcel />
              <DishIcon
                src={dishIcon}
                alt={dishName}
                size={40}
                style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', animation: 'bobD 2.4s ease-in-out infinite' }}
              />
            </div>
          )}
        </div>

        {/* tuk-tuk */}
        {showTuk && (
          <div style={{ position: 'absolute', bottom: 2, left: 0, width: 46, height: 30, animation: 'tukdriveD 34s linear infinite', zIndex: 4 }}>
            <div style={{ transform: 'scale(1.8)', transformOrigin: 'bottom left', position: 'relative', width: 46, height: 30 }}>
              <div style={{ position: 'absolute', bottom: 5, left: 0, width: 44, height: 20, background: '#2fae60', border: '2.5px solid #372a54', borderRadius: '10px 12px 4px 4px' }} />
              <div style={{ position: 'absolute', bottom: 23, left: 4, width: 34, height: 6, background: '#372a54', borderRadius: '4px 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: 11, left: 28, width: 12, height: 9, background: '#cdeafc', border: '2px solid #372a54', borderRadius: 2 }} />
              <div style={{ position: 'absolute', bottom: 0, left: 5, width: 10, height: 10, borderRadius: '50%', background: '#372a54' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 29, width: 10, height: 10, borderRadius: '50%', background: '#372a54' }} />
            </div>
          </div>
        )}
      </div>

      {/* ocean */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '16%', background: 'linear-gradient(#2ba3a0,#157f80)' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: '40%',
            top: 16,
            height: 4,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 20px, transparent 20px 62px)',
            animation: 'shimmer 2.6s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '12%',
            right: '10%',
            top: 44,
            height: 4,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 14px, transparent 14px 50px)',
            animation: 'shimmer 3.4s .8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '24%',
            right: '4%',
            top: 74,
            height: 4,
            background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.2) 0 17px, transparent 17px 56px)',
            animation: 'shimmer 3s 1.4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
