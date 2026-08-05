'use client';

import { useState } from 'react';
import type { Dish } from '@/lib/dishes';
import HangingDrone from '../HangingDrone';

type Props = {
  dish: Dish;
  senderDisplay: string;
  recipientDisplay: string;
  link: string;
  onBack: () => void;
  onPreview: () => void;
};

export default function ShareD({ dish, senderDisplay, recipientDisplay, link, onBack, onPreview }: Props) {
  const [copied, setCopied] = useState(false);
  const displayLink = link.replace(/^https?:\/\//, '');
  // Deliberately generic: opening the link is the reveal, so the dish stays out
  // of the shared message the same way it stays out of the link preview.
  const shareText = `Ado! I sent you a surprise 🚁 (kind of) → ${link}`;

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(link);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const shareWhatsApp = () => {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
      return;
    }
    try {
      window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank');
    } catch {}
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fdf6ea',
        animation: 'fadeUp .35s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 60px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <div onClick={onBack} className="press back-btn" style={{ width: 46, height: 46, borderRadius: 14, fontSize: 22, flex: 'none' }}>
            ‹
          </div>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 34, color: '#372a54' }}>
            Drone&apos;s warming up
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#fff', border: '2.5px solid #372a54', borderRadius: 22, boxShadow: '0 5px 0 #372a54', overflow: 'hidden' }}>
            <div
              style={{
                position: 'relative',
                height: 190,
                background: 'linear-gradient(#8ed0f7,#ffedc2)',
                borderBottom: '2.5px solid #372a54',
                overflow: 'hidden',
              }}
            >
              {/* the design points this at dish.high; at 78px the 256px art is identical and 8× lighter */}
              <HangingDrone dishIcon={dish.low} scale={0.82} top={22} bobAnim="bobD" />
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div className="fredoka" style={{ fontWeight: 600, fontSize: 18, color: '#372a54' }}>
                {senderDisplay} sent you {dish.name} 🛸
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8a7ba8', marginTop: 4 }}>
                Tap to watch the drone fly over Colombo
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                border: '2.5px dashed #b3a8c9',
                borderRadius: 14,
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: 15,
                fontWeight: 700,
                color: '#6d5f8e',
                background: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayLink}
            </div>
            <div
              onClick={copyLink}
              className="press fredoka"
              style={{
                border: '2.5px solid #372a54',
                borderRadius: 14,
                padding: '14px 20px',
                background: copied ? '#c8f0d8' : '#ffd166',
                fontWeight: 600,
                fontSize: 15,
                color: '#372a54',
                whiteSpace: 'nowrap',
                ['--lift' as string]: '3px',
                ['--drop' as string]: '3px',
                ['--rest' as string]: '0',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </div>
          </div>
          <div onClick={shareWhatsApp} className="press cta" style={{ background: '#2fae60', fontSize: 20, padding: 17 }}>
            Share on WhatsApp
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
            <div style={{ flex: 1, height: 2, background: '#e8ddf0' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a394c2', textTransform: 'uppercase', letterSpacing: '.1em' }}>or</span>
            <div style={{ flex: 1, height: 2, background: '#e8ddf0' }} />
          </div>
          <div onClick={onPreview} className="press cta" style={{ background: '#fff', color: '#372a54', fontSize: 19, padding: 17 }}>
            Preview what {recipientDisplay} sees →
          </div>
        </div>
      </div>
    </div>
  );
}
