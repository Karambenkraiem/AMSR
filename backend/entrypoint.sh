#!/bin/sh
set -e

echo "==> Removing deprecated roles from database..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe(\"DELETE FROM \\\"User\\\" WHERE role::text = 'assistant_charge_exploitation'\")
  .catch(() => {})
  .finally(() => p.\$disconnect());
" || true

echo "==> Applying database schema..."
npx prisma db push --accept-data-loss

echo "==> Seeding database..."
node prisma/seed.js

echo "==> Starting AMSR backend..."
exec node src/server.js
