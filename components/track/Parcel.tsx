// The little kraft-paper food parcel with a yellow strap.
export default function Parcel({ width = 26, height = 21, style }: { width?: number; height?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', width, height, background: '#d9915a', border: '2.5px solid #372a54', borderRadius: 4, ...style }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '100%', background: '#ffc94d' }} />
    </div>
  );
}
