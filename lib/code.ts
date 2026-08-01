// Share codes appear in links people paste into chat and occasionally read
// aloud, so the alphabet drops the glyph pairs that get misread: 0/O, 1/I/L.
// U is dropped as well, on Crockford's reasoning that it keeps accidental
// obscenities out of generated codes.
//
// 30 characters over 8 positions is ~6.6e11 possibilities (~39.3 bits).
// Codes are unguessable in practice but not unbounded, which is why the read
// path is rate limited too.
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 8;

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}
