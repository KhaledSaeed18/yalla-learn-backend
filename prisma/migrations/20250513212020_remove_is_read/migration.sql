/*
  Warnings:

  - You are about to drop the column `isRead` on the `ContactForm` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ContactForm_isRead_idx";

-- AlterTable
ALTER TABLE "ContactForm" DROP COLUMN "isRead";
