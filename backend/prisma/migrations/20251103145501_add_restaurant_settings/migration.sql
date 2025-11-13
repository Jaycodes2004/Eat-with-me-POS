/*
  Warnings:

  - Added the required column `updatedAt` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currencySymbol" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "enableMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fssaiNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "taxRules" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "whatsappApiKey" TEXT,
ADD COLUMN     "whatsappPhoneNumber" TEXT;
