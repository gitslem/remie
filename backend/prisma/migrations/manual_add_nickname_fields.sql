-- Manual migration for adding nickname fields
-- Run this SQL directly on your database

-- Add nickname and nicknameSetAt columns to User table
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "nickname" TEXT,
ADD COLUMN IF NOT EXISTS "nicknameSetAt" TIMESTAMP(3);

-- Add unique constraint on nickname
CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_key" ON "User"("nickname");

-- Update UserStatus enum to include PENDING_APPROVAL
-- Note: PostgreSQL doesn't support adding enum values in all versions
-- If this fails, you may need to recreate the enum or use a different approach
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_APPROVAL' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserStatus')) THEN
    ALTER TYPE "UserStatus" ADD VALUE 'PENDING_APPROVAL';
  END IF;
END$$;

-- Add new payment types to PaymentType enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WALLET_FUNDING' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentType')) THEN
    ALTER TYPE "PaymentType" ADD VALUE 'WALLET_FUNDING';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WITHDRAWAL' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentType')) THEN
    ALTER TYPE "PaymentType" ADD VALUE 'WITHDRAWAL';
  END IF;
END$$;

-- Add spending tracking fields to Wallet table
ALTER TABLE "Wallet"
ADD COLUMN IF NOT EXISTS "dailyFundingSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "monthlyFundingSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastDailyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lastMonthlyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lastTransactionAt" TIMESTAMP(3);

-- Verify the changes
SELECT
  'Migration completed successfully!' AS status,
  COUNT(*) FILTER (WHERE column_name = 'nickname') AS nickname_added,
  COUNT(*) FILTER (WHERE column_name = 'nicknameSetAt') AS nicknameSetAt_added
FROM information_schema.columns
WHERE table_name = 'User' AND table_schema = 'public';
