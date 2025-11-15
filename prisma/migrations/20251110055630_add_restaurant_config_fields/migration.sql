-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "autoBackup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "language" TEXT DEFAULT 'English',
ADD COLUMN     "notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT DEFAULT 'light';
