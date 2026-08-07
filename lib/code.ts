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

// The alphabet contains no regex metacharacters, so it drops into a class
// as-is. Built once, from the same constants generateCode draws on, so the
// two can never disagree about what a code looks like.
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/**
 * True for a string this app could have minted.
 *
 * Cheap enough to run before anything expensive: a value that cannot be a code
 * is not worth a rate-limiter round trip, let alone a database write.
 */
export const isCode = (value: string): boolean => CODE_PATTERN.test(value);

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}
