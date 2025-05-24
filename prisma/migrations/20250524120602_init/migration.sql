/*
  Warnings:

  - You are about to drop the column `diseaseId` on the `DiagnosisSuggestion` table. All the data in the column will be lost.
  - You are about to drop the `Disease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserDisease` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DiagnosisSuggestion" DROP CONSTRAINT "DiagnosisSuggestion_diseaseId_fkey";

-- DropForeignKey
ALTER TABLE "UserDisease" DROP CONSTRAINT "UserDisease_diseaseId_fkey";

-- DropForeignKey
ALTER TABLE "UserDisease" DROP CONSTRAINT "UserDisease_userId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "emailIsVerified" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "DiagnosisSuggestion" DROP COLUMN "diseaseId",
ADD COLUMN     "disease" TEXT,
ALTER COLUMN "suggestedByAI" DROP NOT NULL,
ALTER COLUMN "suggestedByAI" DROP DEFAULT,
ALTER COLUMN "suggestedByAI" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Disease";

-- DropTable
DROP TABLE "UserDisease";
