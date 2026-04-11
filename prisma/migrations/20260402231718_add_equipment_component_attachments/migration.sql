-- CreateTable
CREATE TABLE "equipment_component_attachments" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_component_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment_component_attachments" ADD CONSTRAINT "equipment_component_attachments_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "equipment_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;
