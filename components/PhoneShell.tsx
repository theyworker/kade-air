// Full-bleed app on phones; on larger screens the app sits inside a
// playful phone bezel with a fake status bar, like the design mock.
export default function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="stage">
      <div className="bezel">
        <div className="screen">
          <div className="statusbar">
            <span>9:41</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 11 }}>
                <span style={{ width: 3, height: 5, background: '#372a54', borderRadius: 1 }} />
                <span style={{ width: 3, height: 7, background: '#372a54', borderRadius: 1 }} />
                <span style={{ width: 3, height: 9, background: '#372a54', borderRadius: 1 }} />
                <span style={{ width: 3, height: 11, background: '#372a54', borderRadius: 1, opacity: 0.35 }} />
              </div>
              <span style={{ fontSize: 11, opacity: 0.8 }}>5G</span>
              <div style={{ width: 24, height: 12, border: '1.5px solid rgba(55,42,84,.6)', borderRadius: 3, padding: 1.5 }}>
                <div style={{ width: '70%', height: '100%', background: '#372a54', borderRadius: 1 }} />
              </div>
            </div>
          </div>
          <div className="notch" />
          {children}
        </div>
      </div>
    </div>
  );
}
