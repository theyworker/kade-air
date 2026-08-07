import BrandLogo from '@/components/BrandLogo';
import { logoutAction } from '@/app/admin/actions';
import { findDish } from '@/lib/dishes';
import type { DayPoint, DishCount, OrderPage, Totals } from '@/lib/stats';
import OrdersPanel from './OrdersPanel';
import TrendChart from './TrendChart';
import { BAR, INK, MUTED, PAPER, button, card, label } from './ui';

type Props = {
  name: string;
  totals: Totals;
  daily: DayPoint[];
  dishes: DishCount[];
  orders: OrderPage;
  /** true while the published default password still opens this dashboard */
  defaultPassword: boolean;
};

function Tile({ caption, value, note }: { caption: string; value: number; note: string }) {
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={label}>{caption}</div>
      <div
        className="fredoka"
        style={{ fontWeight: 700, fontSize: 42, lineHeight: 1.05, color: INK, marginTop: 6 }}
      >
        {value.toLocaleString('en-US')}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginTop: 4 }}>{note}</div>
    </div>
  );
}

export default function Dashboard({ name, totals, daily, dishes, orders, defaultPassword }: Props) {
  const [top, ...rest] = dishes;
  const topDish = top ? findDish(top.dishId) : null;
  // Bars are scaled against the most popular dish, not the total, so the
  // shortest bar in a close race is still visible.
  const peak = dishes[0]?.count ?? 0;
  const flown = daily.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ minHeight: '100dvh', background: PAPER, color: INK }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '26px 20px 60px' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <BrandLogo width={64} />
            <div>
              <div className="fredoka" style={{ fontWeight: 700, fontSize: 26 }}>
                Control Tower
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginTop: 2 }}>
                Ayubowan, {name} · all times Colombo
              </div>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="press" style={button}>
              Sign out
            </button>
          </form>
        </header>

        {defaultPassword && (
          // Deliberately loud and deliberately not dismissible: every name and
          // message below is readable by anyone who knows the default.
          <div
            role="alert"
            style={{
              ...card,
              background: '#fff6f4',
              borderColor: '#d93a2b',
              boxShadow: '0 5px 0 #d93a2b',
              padding: '14px 18px',
              marginBottom: 16,
            }}
          >
            <div className="fredoka" style={{ fontWeight: 700, fontSize: 16, color: '#d93a2b' }}>
              Still on the default password
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginTop: 4 }}>
              It is written down in the public repo, so anyone can read this page. Set
              ADMIN_PASSWORD_DEVAKA and ADMIN_PASSWORD_DINUK in the deployment&apos;s environment —
              that also signs out every session opened with the default.
            </div>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <Tile caption="Total flights" value={totals.total} note="since day one" />
          <Tile caption="This week" value={totals.week} note="since Monday" />
          <Tile caption="Today" value={totals.today} note="since midnight" />
        </div>

        <section style={{ ...card, padding: 20, marginTop: 16 }}>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 19 }}>
            Flights per day
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginTop: 2, marginBottom: 12 }}>
            Last {daily.length} days · {flown.toLocaleString('en-US')} flights
          </div>
          <TrendChart data={daily} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginTop: 16,
          }}
        >
          <div style={{ ...card, padding: 20 }}>
            <div style={label}>Top of the menu</div>
            {topDish && top ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                <img
                  src={topDish.low}
                  alt=""
                  width={84}
                  height={84}
                  style={{
                    width: 84,
                    height: 84,
                    objectFit: 'contain',
                    background: topDish.c,
                    border: `2.5px solid ${INK}`,
                    borderRadius: 18,
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="fredoka" style={{ fontWeight: 700, fontSize: 24 }}>
                    {topDish.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, marginTop: 3 }}>
                    {top.count.toLocaleString('en-US')}{' '}
                    {top.count === 1 ? 'order' : 'orders'}
                    {totals.total > 0 && ` · ${Math.round((top.count / totals.total) * 100)}% of all flights`}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: MUTED, marginTop: 12 }}>
                Nothing ordered yet.
              </div>
            )}
          </div>

          <div style={{ ...card, padding: 20 }}>
            <div style={label}>Runners-up</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {rest.map((d) => {
                const dish = findDish(d.dishId);
                return (
                  <div key={d.dishId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      title={dish.name}
                      style={{
                        width: 142,
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dish.emoji} {dish.name}
                    </div>
                    {/* Length carries the value and the number is written on
                        the end of every bar, so the colour is decoration. */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          height: 12,
                          width: `${peak ? Math.max(6, (d.count / peak) * 100) : 0}%`,
                          background: BAR,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: MUTED, minWidth: 24, textAlign: 'right' }}>
                      {d.count}
                    </div>
                  </div>
                );
              })}
              {rest.length === 0 && (
                <div style={{ fontSize: 14, fontWeight: 700, color: MUTED }}>
                  Not enough orders yet.
                </div>
              )}
            </div>
          </div>
        </section>

        <div style={{ marginTop: 16 }}>
          <OrdersPanel initial={orders} />
        </div>
      </div>
    </div>
  );
}
