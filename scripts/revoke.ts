import { revokeOrder } from '../lib/orders';

// Revoking is a manual operation for now — no admin UI. Usage:
//   npm run db:revoke -- <code>
async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: npm run db:revoke -- <code>');
    process.exit(1);
  }

  await revokeOrder(code);
  console.log(`Revoked ${code}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
