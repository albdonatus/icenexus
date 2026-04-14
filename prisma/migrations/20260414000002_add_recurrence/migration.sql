CREATE TYPE "RecurrenceType" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');
ALTER TABLE "service_orders" ADD COLUMN "recurrence" "RecurrenceType";
ALTER TABLE "service_orders" ADD COLUMN "recurrenceGroupId" TEXT;
