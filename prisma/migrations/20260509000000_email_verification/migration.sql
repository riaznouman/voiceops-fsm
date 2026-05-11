-- Add email verification fields to users
ALTER TABLE "users"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "verificationCode" TEXT,
  ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3),
  ADD COLUMN "verificationCodeSentAt" TIMESTAMP(3);

-- Backfill: existing users are treated as already verified so their logins keep working
UPDATE "users" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL;
