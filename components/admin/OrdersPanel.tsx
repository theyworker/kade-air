'use client';

import { useState, useTransition } from 'react';
import { fetchOrdersPage } from '@/app/admin/actions';
import { findDish } from '@/lib/dishes';
import type { OrderPage } from '@/lib/stats';
import { INK, LINE, MUTED, button, card, label } from './ui';

const cell: React.CSSProperties = {
  padding: '11px 12px',
  fontSize: 13,
  fontWeight: 600,
  color: INK,
  textAlign: 'left',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};

const head: React.CSSProperties = { ...label, padding: '0 12px 10px', textAlign: 'left' };

export default function OrdersPanel({ initial }: { initial: OrderPage }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(initial);
  const [stale, setStale] = useState(false);
  const [pending, startTransition] = useTransition();

  const go = (page: number) => {
    if (page < 1 || page > data.pages || pending) return;
    startTransition(async () => {
      const next = await fetchOrdersPage(page);
      // null means the session expired between render and click. Say so rather
      // than silently leaving the old page on screen.
      if (next) setData(next);
      else setStale(true);
    });
  };

  if (!open) {
    return (
      <button type="button" className="press" style={button} onClick={() => setOpen(true)}>
        Open all orders ({data.total})
      </button>
    );
  }

  return (
    <div style={{ ...card, padding: 18, background: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div className="fredoka" style={{ fontWeight: 700, fontSize: 19, color: INK }}>
            All orders
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginTop: 2 }}>
            {data.total} total · newest first · notes stay private
          </div>
        </div>
        <button type="button" className="press" style={button} onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      {stale && (
        <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: '#d93a2b', marginBottom: 12 }}>
          Your session expired. Reload the page to sign in again.
        </div>
      )}

      {/* The table is wider than a phone and is allowed to be: it scrolls in its
          own box so the page itself never scrolls sideways. */}
      <div style={{ overflowX: 'auto', opacity: pending ? 0.55 : 1, transition: 'opacity .12s ease' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={head}>When</th>
              <th style={head}>Code</th>
              <th style={head}>Dish</th>
              <th style={head}>From</th>
              <th style={head}>To</th>
              <th style={head}>Message (hidden)</th>
              <th style={{ ...head, textAlign: 'right' }}>Chain</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const dish = findDish(row.dishId);
              return (
                <tr key={row.code} style={{ borderTop: `1.5px solid ${LINE}` }}>
                  <td style={{ ...cell, color: MUTED }}>{row.createdAt}</td>
                  <td style={{ ...cell, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {row.code}
                    {row.revoked && (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#d93a2b' }}>
                        revoked
                      </span>
                    )}
                  </td>
                  <td style={cell}>
                    {dish.emoji} {dish.name}
                  </td>
                  <td style={cell}>{row.sender || '—'}</td>
                  <td style={cell}>{row.recipient || '—'}</td>
                  <td style={{ ...cell, color: MUTED, maxWidth: 260 }}>
                    {row.messageLength > 0 ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Dots stand in for the note without tracing it: the
                            run is capped, so a long message and a very long one
                            look the same. The count beside it is the only
                            detail, and it is the one that is operationally
                            useful — spotting a blank note. */}
                        <span aria-hidden style={{ letterSpacing: 2, color: '#c9bede' }}>
                          {'•'.repeat(Math.min(12, row.messageLength))}
                        </span>
                        <span style={{ fontSize: 11 }}>{row.messageLength} chars</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>#{row.chain}</td>
                </tr>
              );
            })}
            {data.rows.length === 0 && (
              <tr style={{ borderTop: `1.5px solid ${LINE}` }}>
                <td style={{ ...cell, color: MUTED }} colSpan={7}>
                  No orders yet. The kade is quiet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 16,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>
          Page {data.page} of {data.pages}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="press"
            style={{ ...button, opacity: data.page <= 1 ? 0.4 : 1 }}
            onClick={() => go(data.page - 1)}
            disabled={data.page <= 1 || pending}
          >
            ‹ Newer
          </button>
          <button
            type="button"
            className="press"
            style={{ ...button, opacity: data.page >= data.pages ? 0.4 : 1 }}
            onClick={() => go(data.page + 1)}
            disabled={data.page >= data.pages || pending}
          >
            Older ›
          </button>
        </div>
      </div>
    </div>
  );
}
