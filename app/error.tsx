'use client';

import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Surfaced in the browser console and captured by the platform's logs.
    // The digest is the only handle on a production stack trace.
    console.error('[kade-air] render error', error.digest ?? '', error);
  }, [error]);

  return (
    <ErrorScreen
      headline="Ayyo. The drone went down."
      body="Something snapped mid-flight and the parcel is somewhere over the Indian Ocean. Give it another go — the fleet is mostly imaginary anyway."
      action={
        <button
          onClick={reset}
          className="press cta"
          style={{ display: 'block', width: '100%', background: '#ff7a2f', fontSize: 20, border: 'none', font: 'inherit', cursor: 'pointer' }}
        >
          Send the drone up again →
        </button>
      }
      footnote={error.digest ? `error ${error.digest}` : undefined}
    />
  );
}
