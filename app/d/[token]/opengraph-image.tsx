import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { findDish } from '@/lib/dishes';
import { decodeOrder, senderDisplay } from '@/lib/order';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AirKade — a friend sent you food by drone';

// Satori won't fetch by URL and can't decode WebP, so the site artwork is
// transcoded to PNG and inlined. The route is cached, so this runs once a link.
async function pngUri(publicPath: string) {
  const png = await sharp(path.join(process.cwd(), 'public', publicPath)).png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = decodeOrder(decodeURIComponent(token));
  const dish = findDish(order?.dishId ?? 'kottu');
  const sender = order ? senderDisplay(order) : 'Someone';
  const [logo, art] = await Promise.all([pngUri('brand/airkade-logo.webp'), pngUri(dish.low.replace(/^\//, ''))]);

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
    { ...size, emoji: 'twemoji' },
  );
}
