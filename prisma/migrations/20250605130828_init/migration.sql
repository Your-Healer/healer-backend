/*
  Warnings:

  - You are about to drop the column `doctorId` on the `ShiftWorking` table. All the data in the column will be lost.
  - Added the required column `staffId` to the `ShiftWorking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ShiftWorking" DROP CONSTRAINT "ShiftWorking_doctorId_fkey";

-- AlterTable
ALTER TABLE "ShiftWorking" DROP COLUMN "doctorId",
ADD COLUMN     "staffId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ShiftWorking" ADD CONSTRAINT "ShiftWorking_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
