import { headers } from 'next/headers';
import CreateFlow from '@/components/CreateFlow';
import { isDesktopUA } from '@/lib/ua';

export default async function Home({ searchParams }: { searchParams: Promise<{ chain?: string }> }) {
  const [{ chain }, h] = await Promise.all([searchParams, headers()]);
  const chainNum = Math.min(9999, Math.max(1, Math.round(Number(chain)) || 1));
  return <CreateFlow chain={chainNum} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
