import path from 'node:path';
import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import sharp from 'sharp';
import { findDish } from '@/lib/dishes';
import { getOrder } from '@/lib/orders';
import { senderDisplay } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AirKade — a friend sent you food by drone';

// Satori won't fetch by URL and can't decode WebP, so site artwork is
// transcoded to PNG and inlined. The result for a given file is identical on
// every request, so it is computed once per warm instance rather than per
// request — this used to be the single most expensive thing in the route.
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

  const dish = findDish(order?.dishId ?? 'kottu');
  const sender = order ? senderDisplay(order) : 'Someone';
  const [logo, art] = await Promise.all([
    pngUri('brand/airkade-logo.webp'),
    pngUri(dish.low.replace(/^\//, '')),
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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: 60,
          background: 'linear-gradient(180deg, #8ed0f7 0%, #c8e9fb 55%, #ffedc2 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            background: '#fdf6ea',
            border: '8px solid #372a54',
            borderRadius: 48,
            boxShadow: '0 18px 0 #372a54',
            padding: '48px 64px',
            gap: 56,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 280,
              height: 280,
              borderRadius: 280,
              background: dish.c,
              border: '8px solid #372a54',
              padding: 26,
              flexShrink: 0,
            }}
          >
            <img src={art} alt="" width={228} height={228} style={{ objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, minWidth: 0 }}>
            <img src={logo} alt="AirKade" width={186} height={124} />
            <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: '#372a54', lineHeight: 1.08 }}>
              {sender} sent you {dish.name}!
            </div>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#6d5f8e' }}>
              Tap to watch the drone fly over Colombo
            </div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#a394c2' }}>
              100% fake · 100% free · 0 calories
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, emoji: 'twemoji', headers: responseHeaders },
  );
}
