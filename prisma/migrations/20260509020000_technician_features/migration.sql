-- Add push token to users
ALTER TABLE "users" ADD COLUMN "pushToken" TEXT;

-- Add customer signature fields to work orders
ALTER TABLE "work_orders"
  ADD COLUMN "customerSignaturePath" TEXT,
  ADD COLUMN "customerSignatureAt" TIMESTAMP(3);

-- Timesheet table
CREATE TABLE "timesheets" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "hoursWorked" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "timesheets_userId_date_idx" ON "timesheets"("userId", "date");

ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Expense table
CREATE TABLE "expenses" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "receiptPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "expenses_userId_date_idx" ON "expenses"("userId", "date");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_workOrderId_fkey"
  FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
