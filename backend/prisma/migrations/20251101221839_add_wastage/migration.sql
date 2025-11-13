-- CreateTable
CREATE TABLE "Wastage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdBy" TEXT,

    CONSTRAINT "Wastage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WastageItem" (
    "id" TEXT NOT NULL,
    "wastageId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,

    CONSTRAINT "WastageItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WastageItem" ADD CONSTRAINT "WastageItem_wastageId_fkey" FOREIGN KEY ("wastageId") REFERENCES "Wastage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageItem" ADD CONSTRAINT "WastageItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
