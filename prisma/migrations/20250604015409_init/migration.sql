/*
  Warnings:

  - You are about to drop the column `firstname` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `userAccountId` on the `BookingTime` table. All the data in the column will be lost.
  - Added the required column `patientId` to the `BookingTime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `BookingTime` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BookingTime" DROP CONSTRAINT "BookingTime_userAccountId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "firstname",
DROP COLUMN "lastname";

-- AlterTable
ALTER TABLE "BookingTime" DROP COLUMN "userAccountId",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "patientId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DiagnosisSuggestion" ADD COLUMN     "description" TEXT,
ALTER COLUMN "confidence" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTime" ADD CONSTRAINT "BookingTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTime" ADD CONSTRAINT "BookingTime_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTime" ADD CONSTRAINT "BookingTime_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
