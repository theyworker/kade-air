type Props = {
  dishIcon: string;
  /** shrink or grow the whole rig; the design draws it at .82 in the share card */
  scale?: number;
  /** offset from the top of the sky panel */
  top?: number;
  /** 'bob' on the phone, 'bobD' on desktop — same motion, different amplitude */
  bobAnim?: string;
};

// The share card's hero: a drone hovering with the parcel swinging beneath it.
// Same rig as the landing sky panel, minus the crate — here it carries the dish.
export default function HangingDrone({ dishIcon, scale = 1, top = 32, bobAnim = 'bob' }: Props) {
  return (
    <div style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center', position: 'absolute', top, left: '50%' }}>
      <div style={{ animation: `${bobAnim} 3.4s ease-in-out infinite` }}>
        <div style={{ position: 'relative', width: 190, height: 52 }}>
          <div style={{ position: 'absolute', top: 22, left: 0, width: 190, height: 9, background: '#372a54', borderRadius: 5 }} />
          <div style={{ position: 'absolute', top: 14, left: -16, width: 72, height: 18, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s linear infinite' }} />
          <div style={{ position: 'absolute', top: 14, right: -16, width: 72, height: 18, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s .05s linear infinite' }} />
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 98, height: 44, background: '#ff7a2f', border: '3.5px solid #372a54', borderRadius: 24 }} />
          <div style={{ position: 'absolute', top: 27, left: '50%', transform: 'translateX(-50%)', width: 32, height: 18, background: '#cdeafc', border: '2.5px solid #372a54', borderRadius: 7 }} />
          <div style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: '50%',
            marginLeft: -39,
            width: 78,
            transformOrigin: 'top center',
            animation: 'sway 2.2s ease-in-out infinite',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: 4, height: 56, background: '#372a54' }} />
          <img src={dishIcon} alt="" style={{ width: 78, height: 78, marginTop: -18, objectFit: 'contain', display: 'block' }} />
        </div>
      </div>
    </div>
  );
}
