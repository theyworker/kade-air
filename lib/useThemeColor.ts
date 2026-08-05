'use client';

import { useEffect } from 'react';

export type ScreenName = 'home' | 'menu' | 'personalise' | 'share' | 'track' | 'loop';

// The colour each screen paints at the very top of the viewport. Mobile Safari
// (and Chrome on Android) tints its address bar from <meta name="theme-color">,
// so this is what the browser chrome has to match for the app to read as
// full-bleed instead of sitting under a mismatched band.
export const TOP_COLOR: Record<ScreenName, string> = {
  home: '#8ed0f7', // landing sky gradient starts here
  menu: '#fdf6ea',
  personalise: '#fdf6ea',
  share: '#fdf6ea',
  track: '#6cc4f5', // top of the flight world's sky
  loop: '#ffd98f',
};

// Desktop splits the landing into a cream copy column and a sky panel, so no
// single colour spans its top edge — the page colour is the honest answer
// there. Every other screen is the same colour as its phone counterpart.
export const TOP_COLOR_DESKTOP: Record<ScreenName, string> = { ...TOP_COLOR, home: '#fdf6ea' };

// Above this breakpoint globals.css swaps the full-bleed app for a phone bezel
// floating on the stage, so the chrome should match the stage, not the screen
// inside it. Kept in step with the media query in globals.css.
const FRAMED_QUERY = '(min-width: 520px) and (min-height: 700px)';
const FRAME_COLOR = '#fff3d9'; // top stop of the stage's radial gradient

/**
 * Points the browser chrome at `color`.
 *
 * layout.tsx ships a static theme-color for the first paint; every screen
 * change after that has to move the tag itself, which is what this does.
 *
 * `framed` says the caller renders inside PhoneShell, where the bezel can take
 * over on bigger screens and the stage becomes the topmost colour.
 */
export function useThemeColor(color: string, framed = true) {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    const tag = meta;

    if (!framed) {
      tag.content = color;
      return;
    }

    const mq = window.matchMedia(FRAMED_QUERY);
    const apply = () => {
      tag.content = mq.matches ? FRAME_COLOR : color;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [color, framed]);
}
