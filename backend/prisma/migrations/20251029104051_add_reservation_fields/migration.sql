/*
  Warnings:

  - Added the required column `customerName` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "occasion" TEXT,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "specialRequests" TEXT;
