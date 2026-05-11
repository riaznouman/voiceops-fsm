-- Add password reset fields to users
ALTER TABLE "users"
  ADD COLUMN "resetCode" TEXT,
  ADD COLUMN "resetCodeExpiresAt" TIMESTAMP(3),
  ADD COLUMN "resetCodeSentAt" TIMESTAMP(3);
