#!/bin/sh
set -e

echo "==> Applying database schema..."
npx prisma db push --accept-data-loss

echo "==> Seeding database..."
node prisma/seed.js

echo "==> Starting AMSR backend..."
exec node src/server.js
