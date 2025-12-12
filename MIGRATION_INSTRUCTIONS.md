# Database Migration Instructions

## Issue
The Prisma migration tools cannot download required binaries in this environment due to network restrictions (403 Forbidden errors).

## Solution
Run the SQL migration manually directly on your PostgreSQL database.

## Steps to Apply Migration

### Option 1: Using psql Command Line
```bash
# Connect to your database
psql "YOUR_DATABASE_URL"

# Run the migration file
\i backend/prisma/migrations/manual_add_nickname_fields.sql
```

### Option 2: Using pgAdmin or Database GUI
1. Open your database management tool (pgAdmin, DBeaver, etc.)
2. Connect to your PostgreSQL database
3. Open a new SQL query window
4. Copy and paste the contents of `backend/prisma/migrations/manual_add_nickname_fields.sql`
5. Execute the SQL

### Option 3: Using Node.js Script
```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function migrate() {
  const sql = fs.readFileSync('./prisma/migrations/manual_add_nickname_fields.sql', 'utf8');
  await prisma.\$executeRawUnsafe(sql);
  console.log('Migration completed!');
  await prisma.\$disconnect();
}

migrate().catch(console.error);
"
```

## What This Migration Does

### 1. User Table Updates
- Adds `nickname` column (TEXT, unique)
- Adds `nicknameSetAt` column (TIMESTAMP)

### 2. Enum Updates
- Adds `PENDING_APPROVAL` to UserStatus enum
- Adds `WALLET_FUNDING` and `WITHDRAWAL` to PaymentType enum

### 3. Wallet Table Updates
- Adds `dailyFundingSpent` column (DECIMAL(18,2), default 0)
- Adds `monthlyFundingSpent` column (DECIMAL(18,2), default 0)
- Adds `lastDailyReset` column (TIMESTAMP, default now)
- Adds `lastMonthlyReset` column (TIMESTAMP, default now)
- Adds `lastTransactionAt` column (TIMESTAMP, nullable)

## Verification

After running the migration, you can verify it worked by running:

```sql
-- Check User table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User' AND table_schema = 'public'
AND column_name IN ('nickname', 'nicknameSetAt');

-- Check Wallet table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Wallet' AND table_schema = 'public'
AND column_name IN ('dailyFundingSpent', 'monthlyFundingSpent', 'lastDailyReset', 'lastMonthlyReset', 'lastTransactionAt');

-- Check enums
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserStatus');
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentType');
```

## After Migration

Once the migration is applied successfully, you can:

1. **Test the changes:**
   - User signup should set status to PENDING_APPROVAL
   - Settings page should allow nickname to be set once
   - Admin can change nicknames via `/api/v1/admin/users/:userId/nickname`
   - Wallet funding should track daily/monthly spending

2. **Update Prisma Client:**
   ```bash
   # You may need to regenerate the Prisma client
   # This might also fail due to network issues, but try:
   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
   ```

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove columns from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "nickname";
ALTER TABLE "User" DROP COLUMN IF EXISTS "nicknameSetAt";

-- Remove columns from Wallet table
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "dailyFundingSpent";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "monthlyFundingSpent";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "lastDailyReset";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "lastMonthlyReset";
ALTER TABLE "Wallet" DROP COLUMN IF EXISTS "lastTransactionAt";

-- Note: PostgreSQL doesn't support removing enum values easily
-- You would need to recreate the enums if you want to remove the new values
```

## Notes

- All changes use `IF NOT EXISTS` or `IF EXISTS` to make the migration idempotent (safe to run multiple times)
- The migration is designed to be backwards compatible
- Existing data will not be affected
- New columns have sensible defaults
