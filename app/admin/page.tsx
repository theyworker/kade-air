import type { Metadata } from 'next';
import Dashboard from '@/components/admin/Dashboard';
import LoginCard from '@/components/admin/LoginCard';
import { getDailyOrders, getOrdersPage, getTopDishes, getTotals } from '@/lib/stats';
import { currentAdmin } from './session';

export const metadata: Metadata = {
  title: 'Control Tower · Air Kade',
  robots: { index: false, follow: false },
};

// Numbers about *now*, read from a cookie: nothing here may be prerendered or
// cached at the edge.
export const dynamic = 'force-dynamic';

const TREND_DAYS = 30;

export default async function AdminPage() {
  const admin = await currentAdmin();
  if (!admin) return <LoginCard />;

  // Four independent reads over one small table — fired together rather than
  // in sequence, so the dashboard costs one round trip's worth of latency
  // instead of four.
  const [totals, daily, dishes, orders] = await Promise.all([
    getTotals(),
    getDailyOrders(TREND_DAYS),
    getTopDishes(5),
    getOrdersPage(1),
  ]);

  return (
    <Dashboard name={admin.name} totals={totals} daily={daily} dishes={dishes} orders={orders} />
  );
}
