/*
  Warnings:

  - You are about to drop the `AnswerComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionVote` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Question` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AnswerComment" DROP CONSTRAINT "AnswerComment_answerId_fkey";

-- DropForeignKey
ALTER TABLE "AnswerComment" DROP CONSTRAINT "AnswerComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionComment" DROP CONSTRAINT "QuestionComment_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionComment" DROP CONSTRAINT "QuestionComment_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionVote" DROP CONSTRAINT "QuestionVote_questionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionVote" DROP CONSTRAINT "QuestionVote_userId_fkey";

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "AnswerComment";

-- DropTable
DROP TABLE "QuestionComment";

-- DropTable
DROP TABLE "QuestionVote";

-- CreateIndex
CREATE INDEX "Answer_isAccepted_idx" ON "Answer"("isAccepted");

-- CreateIndex
CREATE INDEX "Answer_upvotes_idx" ON "Answer"("upvotes");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE INDEX "Question_slug_idx" ON "Question"("slug");
