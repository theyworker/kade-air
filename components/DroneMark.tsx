type Props = {
  /** 1 = the in-world size used during the flight */
  scale?: number;
  parcel?: boolean;
  tilt?: number;
};

const NATURAL_W = 74;
const BODY_H = 22;
const WITH_PARCEL_H = 64;

// The delivery drone as a standalone mark, built from the same shapes as the
// in-flight Drone so error screens read as the same world. Presentational
// only — no world coordinates, and it hovers rather than flies.
export default function DroneMark({ scale = 1, parcel = true, tilt = -5 }: Props) {
  const naturalH = parcel ? WITH_PARCEL_H : BODY_H;

  return (
    <div style={{ width: NATURAL_W * scale, height: naturalH * scale, position: 'relative' }}>
      {/* The scale sits on its own element: `bob` animates `transform`, so a
          scale on the animated node is thrown away the moment it starts. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: NATURAL_W,
          height: naturalH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div style={{ animation: 'bob 3s ease-in-out infinite' }}>
          <div style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '50% 20%' }}>
            {/* body */}
            <div style={{ position: 'relative', height: BODY_H }}>
              <div style={{ position: 'absolute', top: 8, left: 0, width: 74, height: 3.5, background: '#372a54', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: 5, left: -6, width: 28, height: 7, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s linear infinite' }} />
              <div style={{ position: 'absolute', top: 5, right: -6, width: 28, height: 7, borderRadius: '50%', background: 'rgba(55,42,84,.75)', animation: 'prop .16s .05s linear infinite' }} />
              <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 38, height: 17, background: '#ff7a2f', border: '2.5px solid #372a54', borderRadius: 10 }} />
              <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 12, height: 7, background: '#cdeafc', border: '1.5px solid #372a54', borderRadius: 3 }} />
              <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#ff3b3b', animation: 'blink 1s steps(1) infinite' }} />
            </div>
            {parcel && (
              <div style={{ position: 'absolute', top: 20, left: '50%', transformOrigin: 'top center', animation: 'sway 2.2s ease-in-out infinite' }}>
                <div style={{ width: 2, height: 20, background: '#372a54', marginLeft: -1 }} />
                <div style={{ marginLeft: -12 }}>
                  <div style={{ position: 'relative', width: 24, height: 19, background: '#d9915a', border: '2.5px solid #372a54', borderRadius: 4 }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '100%', background: '#ffc94d' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
