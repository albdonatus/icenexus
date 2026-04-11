-- AlterTable
ALTER TABLE "checklist_templates" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyId" TEXT;
