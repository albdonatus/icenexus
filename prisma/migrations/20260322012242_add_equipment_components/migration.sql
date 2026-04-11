-- CreateTable
CREATE TABLE "equipment_components" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_component_items" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_component_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment_components" ADD CONSTRAINT "equipment_components_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_component_items" ADD CONSTRAINT "equipment_component_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "equipment_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;
