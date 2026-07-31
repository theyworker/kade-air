import Link from 'next/link';
import ErrorScreen from '@/components/ErrorScreen';

export const metadata = {
  title: 'Kade Air — wrong address',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorScreen
      headline="Ayyo. Wrong address."
      body="The drone hovered over this spot for ten minutes and found an empty lot. Nothing here — not even imaginary food."
      action={
        <Link href="/" className="press cta" style={{ display: 'block', width: '100%', background: '#ff7a2f', fontSize: 20, textDecoration: 'none' }}>
          Send someone food instead →
        </Link>
      }
    />
  );
}
