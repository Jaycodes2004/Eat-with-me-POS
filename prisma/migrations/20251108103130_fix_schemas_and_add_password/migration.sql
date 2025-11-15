/*
  Warnings:

  - The `permissions` column on the `Role` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `password` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "permissions",
ADD COLUMN     "permissions" TEXT[];

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "password" TEXT NOT NULL;
