/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRestaurant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserRestaurant" DROP CONSTRAINT "UserRestaurant_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "UserRestaurant" DROP CONSTRAINT "UserRestaurant_userId_fkey";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "userName" TEXT,
ADD COLUMN     "userPassword" TEXT;

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserRestaurant";
