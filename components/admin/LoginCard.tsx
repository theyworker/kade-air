'use client';

import { useActionState, useState } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { loginAction, type LoginState } from '@/app/admin/actions';
import { INK, MUTED, PAPER, card } from './ui';

const EMPTY: LoginState = { error: null };

export default function LoginCard() {
  const [state, submit, pending] = useActionState(loginAction, EMPTY);
  // Controlled on purpose: React resets an uncontrolled form once its action
  // resolves, so after a wrong password the name would be gone too. The
  // password is deliberately left to be retyped.
  const [username, setUsername] = useState('');

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(120% 90% at 50% 0%, #fff3d9 0%, #ffe9c7 55%, #ffdba8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        action={submit}
        style={{ ...card, width: '100%', maxWidth: 380, padding: 26, background: PAPER }}
      >
        <BrandLogo width={128} style={{ margin: '0 auto 6px' }} />
        <div
          className="fredoka"
          style={{ fontWeight: 700, fontSize: 24, color: INK, textAlign: 'center' }}
        >
          Control Tower
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: MUTED,
            textAlign: 'center',
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Staff only. Everyone else, back to the kade.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="field-label" htmlFor="username">
              Who&apos;s flying
            </label>
            <input
              id="username"
              name="username"
              className="field-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="field-input"
              autoComplete="current-password"
              required
            />
          </div>

          {state.error && (
            <div
              // Announced, not just coloured — a failed login has to reach a
              // screen reader too, and it appears after the form is submitted.
              role="alert"
              style={{
                background: '#fff6f4',
                border: '2.5px solid #d93a2b',
                borderRadius: 14,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 700,
                color: '#d93a2b',
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            className="press cta"
            disabled={pending}
            style={{
              background: pending ? MUTED : '#ff7a45',
              fontSize: 17,
              cursor: pending ? 'progress' : 'pointer',
              marginTop: 2,
            }}
          >
            {pending ? 'Checking…' : 'Enter the tower'}
          </button>
        </div>
      </form>
    </div>
  );
}
