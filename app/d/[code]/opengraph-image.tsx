import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import sharp from 'sharp';
import { getOrder } from '@/lib/orders';
import { senderDisplay } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AirKade — a friend sent you a surprise by drone';

// The card deliberately does NOT show which dish was sent — it is a wrapped
// gift and "a surprise". Opening the link is the reveal, so the preview must
// not spoil it. That is why nothing here reads dish data.

// Ink, and the four medallion palettes from the design. The palette is chosen
// per share code rather than per dish: it keeps consecutive links looking
// different without leaking anything about what is inside.
const INK = '#372a54';
const GIFT_INK = '#1e1442';

const PALETTES = [
  { bg: '#ffd9a8', medallion: 'radial-gradient(circle at 42% 34%, #ffe9c9, #ffcf95)' },
  { bg: '#bfe3ff', medallion: 'radial-gradient(circle at 42% 34%, #ddf1ff, #a9d6fb)' },
  { bg: '#c7ecd8', medallion: 'radial-gradient(circle at 42% 34%, #e3f7ec, #a9dcc2)' },
  { bg: '#ffd3de', medallion: 'radial-gradient(circle at 42% 34%, #ffe6ec, #ffbccd)' },
];

/**
 * Stable per code, so a link's card never changes between fetches.
 *
 * FNV-1a with an avalanche step rather than the usual `hash * 31`: the palette
 * count is a power of two, so a weak mixer leaves the choice riding on the last
 * character or two and visually similar codes collide.
 */
function paletteFor(code: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x2545f491);
  hash ^= hash >>> 15;
  return PALETTES[(hash >>> 0) % PALETTES.length];
}

// Satori won't fetch by URL and can't decode WebP, so the logo is transcoded to
// PNG and inlined. Identical on every request, so it is computed once per warm
// instance — this used to be the single most expensive thing in the route.
const transcodes = new Map<string, Promise<string>>();

function pngUri(publicPath: string): Promise<string> {
  let cached = transcodes.get(publicPath);
  if (!cached) {
    cached = sharp(path.join(process.cwd(), 'public', publicPath))
      .png()
      .toBuffer()
      .then((png) => `data:image/png;base64,${png.toString('base64')}`)
      .catch((err) => {
        // Don't memoize a failure — a transient sharp error would otherwise break
        // this card for the life of the instance.
        transcodes.delete(publicPath);
        throw err;
      });
    transcodes.set(publicPath, cached);
  }
  return cached;
}

// Satori cannot use webfonts loaded by CSS; it needs the bytes. Vendored rather
// than fetched at render time so the card never depends on a network call, and
// memoized for the same reason the logo is.
const fonts = new Map<string, Promise<Buffer>>();

function fontData(file: string): Promise<Buffer> {
  let cached = fonts.get(file);
  if (!cached) {
    cached = readFile(path.join(process.cwd(), 'assets', 'fonts', file)).catch((err) => {
      fonts.delete(file);
      throw err;
    });
    fonts.set(file, cached);
  }
  return cached;
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const [{ code }, h] = await Promise.all([params, headers()]);

  // This route is the expensive one — a Satori render per uncached request —
  // so it is limited too, before any lookup or render work. Fails open: a
  // limiter outage must not strip the preview card off every shared link.
  let allowed = true;
  try {
    allowed = (await readLimiter().limit(clientIp(h))).success;
  } catch (err) {
    console.error('[kade-air] read limiter unavailable, allowing request', err);
  }

  const order = allowed ? await getOrder(code).catch(() => null) : null;
  const sender = order ? senderDisplay(order) : 'Someone';
  const { bg, medallion } = paletteFor(code);

  const [logo, fredoka, quicksand] = await Promise.all([
    pngUri('brand/airkade-logo.webp'),
    fontData('Fredoka-Bold.ttf'),
    fontData('Quicksand-Bold.ttf'),
  ]);

  // A resolved card is immutable and can be cached hard. The fallback card is
  // a guess made during an outage or for a dead link — caching it would pin the
  // wrong preview to this URL long after the cause is fixed.
  //
  // Named responseHeaders, not headers — this scope already imports `headers`
  // from next/headers, and a same-named const here would shadow it for the
  // whole function body (TDZ), breaking the `headers()` call above.
  const responseHeaders: Record<string, string> = order
    ? { 'Cache-Control': 'public, max-age=31536000, immutable' }
    : { 'Cache-Control': 'no-store' };

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 70,
          padding: '0 86px',
          background: bg,
          fontFamily: 'Quicksand',
        }}
      >
        {/* daylight wash */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0) 62%)',
          }}
        />
        {/* two Colombo blocks on the skyline */}
        <div
          style={{
            position: 'absolute',
            right: 344,
            bottom: 74,
            width: 150,
            height: 230,
            background: 'rgba(55,42,84,0.08)',
            borderRadius: '22px 22px 0 0',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 74,
            bottom: 74,
            width: 250,
            height: 150,
            background: 'rgba(55,42,84,0.10)',
            borderRadius: '26px 26px 0 0',
          }}
        />
        {/* ground */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 1200,
            height: 74,
            background: 'linear-gradient(#8ccb62, #6fb54a)',
            borderTop: `4px solid ${INK}`,
          }}
        />

        {/* dish medallion — a wrapped gift, never the dish itself */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexShrink: 0,
            width: 352,
            height: 352,
            borderRadius: 352,
            background: '#fff',
            border: `8px solid ${INK}`,
            boxShadow: `0 14px 0 ${INK}`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 22,
              width: 292,
              height: 292,
              borderRadius: 292,
              background: medallion,
            }}
          />

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: 216 }}>
            {/* bow */}
            <div style={{ position: 'relative', display: 'flex', height: 52 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 56,
                  top: 6,
                  width: 52,
                  height: 36,
                  background: '#ff7a2f',
                  border: `6px solid ${GIFT_INK}`,
                  borderRadius: '26px 26px 4px 26px',
                  transform: 'rotate(-16deg)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 108,
                  top: 6,
                  width: 52,
                  height: 36,
                  background: '#ff7a2f',
                  border: `6px solid ${GIFT_INK}`,
                  borderRadius: '26px 26px 26px 4px',
                  transform: 'rotate(16deg)',
                }}
              />
            </div>
            {/* lid */}
            <div
              style={{
                display: 'flex',
                width: 216,
                height: 44,
                marginTop: 2,
                background: '#fbb614',
                border: `6px solid ${GIFT_INK}`,
                borderRadius: 10,
              }}
            />
            {/* box */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                width: 190,
                height: 118,
                marginTop: -2,
                marginLeft: 13,
                background: '#fbb614',
                border: `6px solid ${GIFT_INK}`,
                borderRadius: '0 0 12px 12px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 76,
                  top: -6,
                  width: 26,
                  height: 118,
                  background: GIFT_INK,
                }}
              />
            </div>
            {/* ribbon across the lid */}
            <div
              style={{
                position: 'absolute',
                left: 95,
                top: 52,
                width: 26,
                height: 46,
                background: GIFT_INK,
              }}
            />
          </div>
        </div>

        {/* copy */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <img src={logo} alt="AirKade" width={225} height={150} style={{ marginLeft: -8, marginBottom: 22 }} />
          <div
            style={{
              display: 'flex',
              fontFamily: 'Fredoka',
              fontSize: 86,
              lineHeight: 0.98,
              letterSpacing: -2.5,
              color: INK,
            }}
          >
            {sender} sent you a surprise!
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontFamily: 'Quicksand',
              fontSize: 32,
              lineHeight: 1.3,
              color: '#6d5f8e',
            }}
          >
            Tap to watch your delivery arrive.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'twemoji',
      headers: responseHeaders,
      fonts: [
        { name: 'Fredoka', data: fredoka, weight: 700, style: 'normal' },
        { name: 'Quicksand', data: quicksand, weight: 700, style: 'normal' },
      ],
    },
  );
}
