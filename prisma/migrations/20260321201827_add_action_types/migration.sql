-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN');

-- AlterTable
ALTER TABLE "action_executions" ADD COLUMN     "booleanValue" BOOLEAN,
ADD COLUMN     "numberValue" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT,
ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "maintenance_actions" ADD COLUMN     "type" "ActionType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "units" TEXT[] DEFAULT ARRAY[]::TEXT[];
