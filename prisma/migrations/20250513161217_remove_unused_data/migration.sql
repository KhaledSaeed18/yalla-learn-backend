/*
  Warnings:

  - You are about to drop the `AIConversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AIMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Interview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InterviewMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIConversation" DROP CONSTRAINT "AIConversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "AIMessage" DROP CONSTRAINT "AIMessage_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_userId_fkey";

-- DropForeignKey
ALTER TABLE "InterviewMessage" DROP CONSTRAINT "InterviewMessage_interviewId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropTable
DROP TABLE "AIConversation";

-- DropTable
DROP TABLE "AIMessage";

-- DropTable
DROP TABLE "Interview";

-- DropTable
DROP TABLE "InterviewMessage";

-- DropTable
DROP TABLE "Report";

-- DropEnum
DROP TYPE "InterviewLevel";

-- DropEnum
DROP TYPE "InterviewStatus";

-- DropEnum
DROP TYPE "ReportStatus";
