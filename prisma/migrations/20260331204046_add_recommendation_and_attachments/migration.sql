-- AlterTable
ALTER TABLE "maintenance_actions" ADD COLUMN     "recommendation" TEXT;

-- CreateTable
CREATE TABLE "action_attachments" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_attachments" ADD CONSTRAINT "action_attachments_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "maintenance_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
