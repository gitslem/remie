#!/bin/bash

# Run database migration script
# This script applies the database schema changes

DATABASE_URL="postgresql://postgres@127.0.0.1:5433/remie-database"

echo "========================================="
echo "Running Database Migration"
echo "========================================="

# Run the migration
psql "$DATABASE_URL" -f prisma/migrations/manual_add_nickname_fields_v2.sql

echo ""
echo "========================================="
echo "Verifying Migration"
echo "========================================="

# Verify the changes
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user'
AND column_name IN ('nickname', 'nicknameSetAt', 'approvedBy', 'approvedAt')
ORDER BY column_name;
"

psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'wallet'
AND column_name IN ('dailyFundingSpent', 'monthlyFundingSpent', 'lastDailyReset', 'lastMonthlyReset', 'lastTransactionAt')
ORDER BY column_name;
"

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
