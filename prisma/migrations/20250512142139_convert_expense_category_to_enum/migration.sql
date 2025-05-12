/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the `ExpenseCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategoryType" AS ENUM ('HOUSING', 'FOOD', 'TRANSPORTATION', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'CLOTHING', 'UTILITIES', 'SUBSCRIPTIONS', 'SAVINGS', 'PERSONAL_CARE', 'GIFTS', 'TRAVEL', 'TECH', 'INSURANCE', 'OTHER');

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseCategory" DROP CONSTRAINT "ExpenseCategory_userId_fkey";

-- DropIndex
DROP INDEX "Budget_categoryId_idx";

-- DropIndex
DROP INDEX "Expense_categoryId_idx";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "categoryId",
ADD COLUMN     "category" "ExpenseCategoryType" NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "categoryId",
ADD COLUMN     "category" "ExpenseCategoryType" NOT NULL;

-- DropTable
DROP TABLE "ExpenseCategory";
