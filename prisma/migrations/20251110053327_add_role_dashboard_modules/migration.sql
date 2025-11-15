-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "dashboardModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "permissions" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "dashboardModules" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
