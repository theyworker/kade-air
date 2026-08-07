import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_USERS,
  DEFAULT_PASSWORD,
  SESSION_TTL_SECONDS,
  createSession,
  findUser,
  readSession,
  usingDefaultPassword,
  verifyCredentials,
  type Env,
} from '../lib/adminAuth';

const env: Env = { ADMIN_PASSWORD_DEVAKA: 'kottu-please', ADMIN_PASSWORD_DINUK: 'extra-sambol' };
const NOW = 1_770_000_000_000;

describe('the roster', () => {
  test('is exactly Devaka and Dinuk', () => {
    assert.deepEqual(
      ADMIN_USERS.map((u) => u.username),
      ['devaka', 'dinuk'],
    );
  });

  test('matches a username case-insensitively and ignores padding', () => {
    assert.equal(findUser('  DeVaKa ')?.name, 'Devaka');
  });

  test('does not invent users', () => {
    assert.equal(findUser('admin'), null);
    assert.equal(findUser(''), null);
  });
});

describe('verifyCredentials', () => {
  test('accepts the right password', () => {
    assert.equal(verifyCredentials('devaka', 'kottu-please', env)?.name, 'Devaka');
    assert.equal(verifyCredentials('DINUK', 'extra-sambol', env)?.name, 'Dinuk');
  });

  test('rejects the wrong password', () => {
    assert.equal(verifyCredentials('devaka', 'extra-sambol', env), null);
    assert.equal(verifyCredentials('devaka', '', env), null);
  });

  test('rejects an unknown user however plausible the password', () => {
    assert.equal(verifyCredentials('dinesh', 'kottu-please', env), null);
  });

  // The dangerous shape of a "password is optional" bug: nothing configured,
  // and an empty submission sails through on the falsy check.
  test('an unset password falls back to the default, not to nothing', () => {
    assert.equal(verifyCredentials('devaka', '', {}), null);
    assert.equal(verifyCredentials('devaka', 'anything', {}), null);
    assert.equal(verifyCredentials('devaka', DEFAULT_PASSWORD, {})?.name, 'Devaka');
    // An empty string in the environment is unset, not a blank password.
    assert.equal(verifyCredentials('devaka', '', { ADMIN_PASSWORD_DEVAKA: '' }), null);
    assert.equal(verifyCredentials('devaka', DEFAULT_PASSWORD, { ADMIN_PASSWORD_DEVAKA: '' })?.name, 'Devaka');
  });

  test('a configured password replaces the default rather than joining it', () => {
    assert.equal(verifyCredentials('devaka', DEFAULT_PASSWORD, env), null);
    assert.equal(verifyCredentials('devaka', 'kottu-please', env)?.name, 'Devaka');
  });

  test('the default-password warning tracks each account separately', () => {
    assert.equal(usingDefaultPassword({}), true);
    assert.equal(usingDefaultPassword({ ADMIN_PASSWORD_DEVAKA: 'kottu-please' }), true);
    assert.equal(usingDefaultPassword(env), false);
  });
});

describe('sessions', () => {
  test('a fresh token reads back as its user', () => {
    const token = createSession('devaka', NOW, env);
    assert.ok(token);
    assert.equal(readSession(token, NOW + 1000, env)?.name, 'Devaka');
  });

  test('no token, no session', () => {
    assert.equal(readSession(undefined, NOW, env), null);
    assert.equal(readSession('', NOW, env), null);
    assert.equal(readSession('devaka', NOW, env), null);
  });

  test('expires on its own deadline', () => {
    const token = createSession('devaka', NOW, env);
    const ttl = SESSION_TTL_SECONDS * 1000;
    assert.ok(readSession(token, NOW + ttl - 1000, env));
    assert.equal(readSession(token, NOW + ttl + 1000, env), null);
  });

  test('a tampered payload fails the signature', () => {
    const token = createSession('devaka', NOW, env) as string;
    const signature = token.slice(token.lastIndexOf('.') + 1);

    // Same signature, someone else's name.
    assert.equal(readSession(`dinuk.${NOW + 60_000}.${signature}`, NOW, env), null);
    // Same signature, a deadline pushed into next year.
    assert.equal(readSession(`devaka.${NOW + 9e10}.${signature}`, NOW, env), null);
    // Signature replaced with garbage, and with nothing at all.
    assert.equal(readSession(token.slice(0, -4) + 'beef', NOW, env), null);
    assert.equal(readSession(token.slice(0, token.lastIndexOf('.') + 1), NOW, env), null);
  });

  test('a token signed under an older password is dead', () => {
    const token = createSession('devaka', NOW, env);
    const rotated: Env = { ...env, ADMIN_PASSWORD_DEVAKA: 'kiribath-instead' };
    assert.equal(readSession(token, NOW + 1000, rotated), null);
  });

  test('a token minted under the default dies when real passwords arrive', () => {
    const onDefault = createSession('devaka', NOW, {});
    assert.ok(readSession(onDefault, NOW + 1000, {}));
    assert.equal(readSession(onDefault, NOW + 1000, env), null);
  });

  test('will not mint a token for someone off the roster', () => {
    assert.equal(createSession('mallory', NOW, env), null);
  });
});
