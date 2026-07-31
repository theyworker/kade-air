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

export default function Share({ dish, senderDisplay, recipientDisplay, link, onBack, onPreview }: Props) {
  const [copied, setCopied] = useState(false);
  const displayLink = link.replace(/^https?:\/\//, '');
  const shareText = `Ado! I sent you ${dish.name} ${dish.emoji} (kind of) → ${link}`;

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fdf6ea', animation: 'fadeUp .35s ease' }}>
      <div className="screen-head">
        <div onClick={onBack} className="press back-btn">
          ‹
        </div>
        <div className="fredoka" style={{ fontWeight: 700, fontSize: 24, color: '#372a54' }}>
          Drone&apos;s warming up
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 22px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#fff', border: '2.5px solid #372a54', borderRadius: 20, boxShadow: '0 5px 0 #372a54', overflow: 'hidden' }}>
          <div
            style={{
              position: 'relative',
              height: 200,
              background: 'linear-gradient(#8ed0f7,#ffedc2)',
              borderBottom: '2.5px solid #372a54',
              overflow: 'hidden',
            }}
          >
            <HangingDrone dishIcon={dish.low} scale={0.82} />
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div className="fredoka" style={{ fontWeight: 600, fontSize: 15, color: '#372a54' }}>
              {senderDisplay} sent you {dish.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8a7ba8', marginTop: 3 }}>
              Tap to watch the drone fly over Colombo
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              border: '2.5px dashed #b3a8c9',
              borderRadius: 14,
              padding: '13px 14px',
              fontFamily: 'monospace',
              fontSize: 14,
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
              padding: '13px 16px',
              background: copied ? '#c8f0d8' : '#ffd166',
              fontWeight: 600,
              fontSize: 14,
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
        <div onClick={shareWhatsApp} className="press cta" style={{ background: '#2fae60', fontSize: 19, padding: 16 }}>
          Share on WhatsApp
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1, height: 2, background: '#e8ddf0' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a394c2', textTransform: 'uppercase', letterSpacing: '.1em' }}>or</span>
          <div style={{ flex: 1, height: 2, background: '#e8ddf0' }} />
        </div>
        <div onClick={onPreview} className="press cta" style={{ background: '#fff', color: '#372a54', fontSize: 18, padding: 16 }}>
          Preview what {recipientDisplay} sees →
        </div>
      </div>
    </div>
  );
}
