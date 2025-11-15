-- Add customer loyalty/referral fields when missing
ALTER TABLE "Customer"
    ADD COLUMN IF NOT EXISTS "anniversary" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "loyaltyTier" TEXT NOT NULL DEFAULT 'bronze',
    ADD COLUMN IF NOT EXISTS "preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
    ADD COLUMN IF NOT EXISTS "referralCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "referredBy" TEXT,
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- Ensure updatedAt populated for legacy rows
UPDATE "Customer" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Guarantee referral code uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_referralCode_key" ON "Customer"("referralCode");

-- Create loyalty reward catalog if absent
CREATE TABLE IF NOT EXISTS "LoyaltyReward" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "pointsRequired" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "value" DOUBLE PRECISION NOT NULL,
        "validUntil" TIMESTAMP(3),
        "maxRedemptions" INTEGER,
        "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- Create loyalty rule table if absent
CREATE TABLE IF NOT EXISTS "LoyaltyRule" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "condition" TEXT NOT NULL,
        "pointsPerRupee" DOUBLE PRECISION,
        "bonusPoints" INTEGER,
        "minOrderValue" DOUBLE PRECISION,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LoyaltyRule_pkey" PRIMARY KEY ("id")
);

-- Create recipe definitions if absent
CREATE TABLE IF NOT EXISTS "Recipe" (
        "id" TEXT NOT NULL,
        "menuItemId" TEXT,
        "ingredients" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "yield" DOUBLE PRECISION NOT NULL DEFAULT 1,
        "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "preparationTime" INTEGER,
        "instructions" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- Create expense table when missing and bring legacy schema up to date
CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "subcategory" TEXT,
        "amount" DOUBLE PRECISION NOT NULL,
        "netAmount" DOUBLE PRECISION,
        "taxAmount" DOUBLE PRECISION,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "vendor" TEXT NOT NULL,
        "description" TEXT,
        "paymentMethod" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "receiptUrl" TEXT,
        "receiptNumber" TEXT,
        "recurring" BOOLEAN NOT NULL DEFAULT false,
        "recurringPeriod" TEXT,
        "approvedBy" TEXT,
        "supplierId" TEXT,
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense"
    ADD COLUMN IF NOT EXISTS "subcategory" TEXT,
    ADD COLUMN IF NOT EXISTS "netAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "taxAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "recurring" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "recurringPeriod" TEXT,
    ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
    ADD COLUMN IF NOT EXISTS "supplierId" TEXT,
    ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create budget categories if absent
CREATE TABLE IF NOT EXISTS "BudgetCategory" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "icon" TEXT,
        "color" TEXT,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- Attach recipe to menu items when constraint missing
DO $$
BEGIN
    ALTER TABLE "Recipe"
        ADD CONSTRAINT "Recipe_menuItemId_fkey"
        FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Attach expenses to suppliers where applicable
DO $$
BEGIN
    ALTER TABLE "Expense"
        ADD CONSTRAINT "Expense_supplierId_fkey"
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
