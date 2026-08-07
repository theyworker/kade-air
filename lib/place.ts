// Where a request looked like it came from, estimated from its IP by the edge
// that received it.
//
// This is an estimate, and a coarse one. A VPN, a corporate proxy, or Sri
// Lanka's carrier-grade NAT can put a request hundreds of kilometres from the
// person who made it, so what is stored here is a label to read on a row — not
// something to decide anything on.
//
// The estimate rides on headers the platform already attaches to the request,
// so nothing here calls a geolocation service, and no lookup slows an order
// down. The raw IP is deliberately never stored: the coarse label is the whole
// of what we keep, which is what makes this safe to sit next to a real name.

import { clean } from './order';

export type Place = {
  /** Human-readable, finest-first: "Colombo, WP, LK". Empty when unknown. */
  label: string;
  /**
   * IANA zone the estimate implies ("Asia/Colombo"). Stored alongside the
   * label because a timestamp on its own does not answer "what time was it
   * for them" — this is what turns a stored instant back into their daytime.
   * Empty when unknown.
   */
  timeZone: string;
};

export const UNKNOWN_PLACE: Place = { label: '', timeZone: '' };

// Generous next to a city name plus region and country codes, and small enough
// that a header nobody validates cannot bloat a row.
export const MAX_PLACE = 80;

// City names arrive percent-encoded ("S%C3%A3o%20Paulo"). A malformed value is
// a header we did not write, so it is kept as-is rather than thrown over.
function decode(value: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// The placeholders edge networks send when the lookup itself failed. Keeping
// them would render as a location ("ZZ") that never existed.
const UNKNOWN_MARKERS = /^(XX|ZZ|T1)$/i;
const usable = (value: string) => (UNKNOWN_MARKERS.test(value) ? '' : value);

/**
 * Reads the request's estimated origin off the headers the edge attached.
 *
 * Vercel's names first, Cloudflare's as the fallback, so this keeps working if
 * the deployment ever moves. Anywhere else — including local development — every
 * header is absent and the result is UNKNOWN_PLACE, which is stored as empty
 * strings rather than a guess.
 */
export function placeFromHeaders(headers: Headers): Place {
  const pick = (vercel: string, cloudflare: string) =>
    usable(decode(headers.get(vercel) ?? headers.get(cloudflare)));

  const city = pick('x-vercel-ip-city', 'cf-ipcity');
  const region = pick('x-vercel-ip-country-region', 'cf-region-code');
  const country = pick('x-vercel-ip-country', 'cf-ipcountry');

  return sanitizePlace({
    label: [city, region, country].filter(Boolean).join(', '),
    timeZone: pick('x-vercel-ip-timezone', 'cf-timezone'),
  });
}

/**
 * The validation gate for a place on its way into the database.
 *
 * Applied on write and again on read, for the same reason sanitizeOrder is: a
 * header is unvalidated input, and a row written by an older version of this
 * code was written under older rules.
 */
export function sanitizePlace(place: Partial<Place> | null | undefined): Place {
  if (!place) return UNKNOWN_PLACE;
  return {
    label: clean(place.label ?? '', MAX_PLACE),
    // A zone only means something if it is one Intl knows, and an unknown one
    // would throw at the moment it was needed rather than here.
    timeZone: knownZone(clean(place.timeZone ?? '', MAX_PLACE)),
  };
}

function knownZone(timeZone: string): string {
  if (!timeZone) return '';
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return timeZone;
  } catch {
    return '';
  }
}

/** What a place reads as when it is empty, so a row never prints as a blank. */
export const placeDisplay = (place: Place) => place.label || 'an unknown place';

/**
 * A stored instant, read back in the local time of whoever it belongs to.
 *
 * Falls back to UTC when the zone is unknown, and says which zone it used —
 * "17:32" without that is not an answer to when something happened.
 */
export function localTime(at: Date, place: Place): string {
  const timeZone = place.timeZone || 'UTC';
  const format = (zone: string) =>
    `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: zone }).format(at)} (${zone})`;
  try {
    return format(timeZone);
  } catch {
    return format('UTC');
  }
}
