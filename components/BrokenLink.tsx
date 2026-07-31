import Link from 'next/link';
import ErrorScreen from './ErrorScreen';

// Playful fallback for invalid or mangled share links.
export default function BrokenLink() {
  return (
    <ErrorScreen
      headline="Ayyo. This link went stale."
      body="The drone circled Colombo three times and couldn't find your parcel. It happens — even to imaginary food."
      action={
        <Link href="/" className="press cta" style={{ display: 'block', width: '100%', background: '#ff7a2f', fontSize: 20, textDecoration: 'none' }}>
          Send someone food instead →
        </Link>
      }
    />
  );
}
