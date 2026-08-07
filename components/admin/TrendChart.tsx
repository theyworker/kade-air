'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayPoint } from '@/lib/stats';
import { INK, LINE, MUTED, SERIES, card } from './ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The day arrives as a Colombo-local 'YYYY-MM-DD' string and is split, not
// parsed: `new Date('2026-08-07')` is UTC midnight, which in a browser west of
// Greenwich renders as the 6th. Splitting keeps the label the day the server
// meant.
function dayLabel(day: string): string {
  const [, m, d] = day.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`;
}

type TipProps = {
  active?: boolean;
  payload?: Array<{ payload: DayPoint }>;
};

function Tip({ active, payload }: TipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div style={{ ...card, boxShadow: `0 3px 0 ${INK}`, padding: '8px 12px', borderRadius: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED }}>{dayLabel(point.day)}</div>
      <div className="fredoka" style={{ fontWeight: 700, fontSize: 18, color: INK }}>
        {point.count} {point.count === 1 ? 'flight' : 'flights'}
      </div>
    </div>
  );
}

export default function TrendChart({ data }: { data: DayPoint[] }) {
  // A flat line at zero is a real answer, but Recharts would draw it against a
  // 0–0 axis. A floor of 4 keeps an early, quiet week looking quiet instead of
  // filling the panel with noise.
  const peak = Math.max(4, ...data.map((d) => d.count));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 14, bottom: 0, left: 0 }}>
          {/* Horizontal only: the x axis is time, and vertical rules through it
              add lines without adding readings. */}
          <CartesianGrid stroke={LINE} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={dayLabel}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            minTickGap={26}
            tick={{ fill: MUTED, fontSize: 11, fontWeight: 700 }}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, peak]}
            width={34}
            tickLine={false}
            axisLine={false}
            tick={{ fill: MUTED, fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip content={<Tip />} cursor={{ stroke: MUTED, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line
            // Straight segments, not a spline: a curve through daily counts
            // invents Tuesday-afternoon values that were never measured, and
            // overshoots past the day's actual peak on the way to the next one.
            type="linear"
            dataKey="count"
            stroke={SERIES}
            strokeWidth={2}
            // No dot per day — 30 of them turn a trend into a beaded necklace.
            // The hovered point gets one, ringed in the surface colour so it
            // reads as lifted off the line.
            dot={false}
            activeDot={{ r: 5, fill: SERIES, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
