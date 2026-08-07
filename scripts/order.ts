import { neonStore } from '../lib/db';
import { localTime, placeDisplay } from '../lib/place';

// Reading a single order, including when it was sent and opened. Like revoking,
// this is a manual operation for now — no admin UI. Usage:
//   npm run db:order -- <code>
//
// It goes straight to Neon rather than through lib/orders.ts: the cache holds
// only what a recipient sees, and the timestamps below are the point here.
async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: npm run db:order -- <code>');
    process.exit(1);
  }

  const order = await neonStore.findByCode(code);
  if (!order) {
    console.error(`No order with code ${code}.`);
    process.exit(1);
  }

  console.log(`Order ${order.code}`);
  console.log(`  dish        ${order.dishId}`);
  console.log(`  chain       #${order.chain}`);
  console.log(`  from        ${order.sender || '(blank)'}`);
  console.log(`  to          ${order.recipient || '(blank)'}`);
  console.log('');
  // Each side is read back in its own estimated zone, so "sent 9pm, opened
  // 7am" says what it looks like it says even across a border.
  console.log(`  sent        ${localTime(order.createdAt, order.senderPlace)}`);
  console.log(`  sent from   ${placeDisplay(order.senderPlace)}`);
  console.log(
    `  opened      ${order.openedAt ? localTime(order.openedAt, order.openedPlace) : 'not yet'}`,
  );
  console.log(`  opened from ${order.openedAt ? placeDisplay(order.openedPlace) : '—'}`);

  if (order.revokedAt) console.log(`\n  revoked     ${order.revokedAt.toISOString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
