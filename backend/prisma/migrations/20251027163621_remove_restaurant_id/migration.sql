/*
  Warnings:

  - You are about to drop the column `restaurantId` on the `MenuItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_restaurantId_fkey";

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "restaurantId";
