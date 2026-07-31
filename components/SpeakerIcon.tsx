// The design's speaker: orange cone, teal waves that grey out when muted,
// and a red cross that fades in over them. 21px on the phone, 24 on desktop.
export default function SpeakerIcon({ muted, size = 21 }: { muted: boolean; size?: number }) {
  const wave = muted ? 'rgba(55,42,84,.22)' : '#17a398';
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#372a54" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" fill="#ff7a2f" />
      <path d="M16 9.2a4 4 0 0 1 0 5.6" stroke={wave} />
      <path d="M18.8 6.6a7.6 7.6 0 0 1 0 10.8" stroke={wave} />
      <path d="M16.4 8.6l6 6.8M22.4 8.6l-6 6.8" stroke="#ff3b3b" opacity={muted ? 1 : 0} />
    </svg>
  );
}
