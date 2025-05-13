/*
  Warnings:

  - You are about to drop the `SavingsGoal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SavingsGoal" DROP CONSTRAINT "SavingsGoal_userId_fkey";

-- DropTable
DROP TABLE "SavingsGoal";
