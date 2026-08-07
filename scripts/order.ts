import { neonStore } from '../lib/db';
import { localTime, placeDisplay } from '../lib/place';

// Reading a single order, including every time it was opened. Like revoking,
// this is a manual operation for now — no admin UI. Usage:
//   npm run db:order -- <code>
//
// It goes straight to Neon rather than through lib/orders.ts' cache, which
// holds only what a recipient sees and none of what is printed below.
async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: npm run db:order -- <code>');
    process.exit(1);
  }

  const [order, opens] = await Promise.all([neonStore.findByCode(code), neonStore.opensOf(code)]);
  if (!order) {
    console.error(`No order with code ${code}.`);
    process.exit(1);
  }

  console.log(`Order ${order.code}`);
  console.log(`  dish       ${order.dishId}`);
  console.log(`  chain      #${order.chain}`);
  console.log(`  from       ${order.sender || '(blank)'}`);
  console.log(`  to         ${order.recipient || '(blank)'}`);
  console.log('');
  // Each moment is read back in its own estimated zone, so "sent 9pm, opened
  // 7am" says what it looks like it says even across a border.
  console.log(`  sent       ${localTime(order.createdAt, order.senderPlace)}`);
  console.log(`  sent from  ${placeDisplay(order.senderPlace)}`);
  if (order.revokedAt) console.log(`  revoked    ${order.revokedAt.toISOString()}`);

  console.log('');
  if (opens.length === 0) {
    console.log('  Never opened.');
  } else {
    // Every opening, not just the first: a delivery watched twice was opened
    // twice, and the shape of that is the point of keeping them all.
    console.log(`  Opened ${opens.length} ${opens.length === 1 ? 'time' : 'times'}`);
    for (const [i, open] of opens.entries()) {
      console.log(
        `    ${String(i + 1).padStart(3)}. ${localTime(open.at, open.place)} — ${placeDisplay(open.place)}`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
