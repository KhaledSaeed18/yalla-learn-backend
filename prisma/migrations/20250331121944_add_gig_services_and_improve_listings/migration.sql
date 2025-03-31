/*
  Warnings:

  - Changed the type of `category` on the `Listing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('ELECTRONICS', 'CLOTHING', 'BOOKS', 'COURSE_MATERIALS', 'MUSICAL_INSTRUMENTS', 'SPORTS_EQUIPMENT', 'TOOLS', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceDirection" AS ENUM ('OFFERING', 'REQUESTING');

-- CreateEnum
CREATE TYPE "GigCategory" AS ENUM ('TUTORING', 'NOTES_SHARING', 'ACADEMIC_WRITING', 'DESIGN_SERVICES', 'CODING_HELP', 'LANGUAGE_TRANSLATION', 'EVENT_PLANNING', 'PHOTOGRAPHY', 'MUSIC_LESSONS', 'RESEARCH_ASSISTANCE', 'EXAM_PREP', 'RESUME_WRITING', 'CAMPUS_DELIVERY', 'TECHNICAL_REPAIR', 'OTHER');

-- DropIndex
DROP INDEX "Listing_title_idx";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "category",
ADD COLUMN     "category" "ListingCategory" NOT NULL;

-- CreateTable
CREATE TABLE "GigService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "category" "GigCategory" NOT NULL,
    "direction" "ServiceDirection" NOT NULL DEFAULT 'OFFERING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GigService_userId_idx" ON "GigService"("userId");

-- CreateIndex
CREATE INDEX "GigService_direction_idx" ON "GigService"("direction");

-- CreateIndex
CREATE INDEX "GigService_createdAt_idx" ON "GigService"("createdAt");

-- CreateIndex
CREATE INDEX "GigService_price_idx" ON "GigService"("price");

-- CreateIndex
CREATE INDEX "GigService_category_idx" ON "GigService"("category");

-- CreateIndex
CREATE INDEX "Listing_category_idx" ON "Listing"("category");

-- AddForeignKey
ALTER TABLE "GigService" ADD CONSTRAINT "GigService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
