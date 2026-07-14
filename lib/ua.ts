// Server-side guess for the initial layout variant; the client corrects
// it against the real viewport after hydration (see useIsDesktop).
export function isDesktopUA(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}
