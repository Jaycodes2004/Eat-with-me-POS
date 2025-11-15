-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "creditDays" INTEGER,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "lastOrderDate" TIMESTAMP(3),
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "totalAmount" DOUBLE PRECISION,
ADD COLUMN     "totalOrders" INTEGER,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
