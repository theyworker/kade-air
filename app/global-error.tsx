'use client';

import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';
// global-error replaces the root layout, so its stylesheet import doesn't
// apply here — bring it in directly or the drone loses its keyframes.
import './globals.css';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[kade-air] root layout error', error.digest ?? '', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ErrorScreen
          headline="Ayyo. Total engine failure."
          body="The whole fleet is grounded. Reload and we'll pretend this never happened."
          action={
            <button
              onClick={reset}
              className="press cta"
              style={{ display: 'block', width: '100%', background: '#ff7a2f', fontSize: 20, border: 'none', font: 'inherit', cursor: 'pointer' }}
            >
              Restart the fleet →
            </button>
          }
          footnote={error.digest ? `error ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
