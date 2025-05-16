/*
  Warnings:

  - The primary key for the `Account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emailIsVerified` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `walletMnemonic` on the `Account` table. All the data in the column will be lost.
  - The primary key for the `Appointment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fromTime` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `toTime` on the `Appointment` table. All the data in the column will be lost.
  - The primary key for the `Attachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Department` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MedicalRoom` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Position` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ShiftWorking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Staff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `phoneNumber` on the `Staff` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `StaffsOnDepartments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffsOnPositions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[walletAddress]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingTimeId]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - Made the column `walletAddress` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `bookingTimeId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicalRoomId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `MedicalRoom` table without a default value. This is not possible if the table is not empty.
  - Made the column `doctorId` on table `ShiftWorking` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "APPOINTMENTSTATUS" AS ENUM ('IDLE', 'BOOKED', 'PAID', 'CANCEL');

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_avatarId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRoom" DROP CONSTRAINT "MedicalRoom_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftWorking" DROP CONSTRAINT "ShiftWorking_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "ShiftWorking" DROP CONSTRAINT "ShiftWorking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_accountId_fkey";

-- DropForeignKey
ALTER TABLE "StaffsOnDepartments" DROP CONSTRAINT "StaffsOnDepartments_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "StaffsOnDepartments" DROP CONSTRAINT "StaffsOnDepartments_staffId_fkey";

-- DropForeignKey
ALTER TABLE "StaffsOnPositions" DROP CONSTRAINT "StaffsOnPositions_positionId_fkey";

-- DropForeignKey
ALTER TABLE "StaffsOnPositions" DROP CONSTRAINT "StaffsOnPositions_staffId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_accountId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP CONSTRAINT "Account_pkey",
DROP COLUMN "emailIsVerified",
DROP COLUMN "walletMnemonic",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT,
ALTER COLUMN "avatarId" SET DATA TYPE TEXT,
ALTER COLUMN "username" SET DATA TYPE TEXT,
ALTER COLUMN "password" SET DATA TYPE TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "phoneNumber" SET DATA TYPE TEXT,
ALTER COLUMN "firstname" SET DATA TYPE TEXT,
ALTER COLUMN "lastname" SET DATA TYPE TEXT,
ALTER COLUMN "walletAddress" SET NOT NULL,
ALTER COLUMN "walletAddress" SET DATA TYPE TEXT,
ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Account_id_seq";

-- AlterTable
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_pkey",
DROP COLUMN "fromTime",
DROP COLUMN "roomId",
DROP COLUMN "toTime",
ADD COLUMN     "bookingTimeId" TEXT NOT NULL,
ADD COLUMN     "medicalRoomId" TEXT NOT NULL,
ADD COLUMN     "status" "APPOINTMENTSTATUS" NOT NULL DEFAULT 'IDLE',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "patientId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Appointment_id_seq";

-- AlterTable
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "fileName" SET DATA TYPE TEXT,
ALTER COLUMN "directory" SET DATA TYPE TEXT,
ALTER COLUMN "length" DROP DEFAULT,
ALTER COLUMN "length" SET DATA TYPE BIGINT,
ALTER COLUMN "mediaType" SET DATA TYPE TEXT,
ADD CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Attachment_id_seq";

-- AlterTable
ALTER TABLE "Department" DROP CONSTRAINT "Department_pkey",
ADD COLUMN     "locationId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "symbol" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "Department_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Department_id_seq";

-- AlterTable
ALTER TABLE "MedicalRoom" DROP CONSTRAINT "MedicalRoom_pkey",
ADD COLUMN     "serviceId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "departmentId" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "MedicalRoom_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MedicalRoom_id_seq";

-- AlterTable
ALTER TABLE "Position" DROP CONSTRAINT "Position_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "Position_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Position_id_seq";

-- AlterTable
ALTER TABLE "Role" DROP CONSTRAINT "Role_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ADD CONSTRAINT "Role_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Role_id_seq";

-- AlterTable
ALTER TABLE "ShiftWorking" DROP CONSTRAINT "ShiftWorking_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "doctorId" SET NOT NULL,
ALTER COLUMN "doctorId" SET DATA TYPE TEXT,
ALTER COLUMN "roomId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ShiftWorking_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ShiftWorking_id_seq";

-- AlterTable
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_pkey",
DROP COLUMN "phoneNumber",
ADD COLUMN     "introduction" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "firstname" SET DATA TYPE TEXT,
ALTER COLUMN "lastname" SET DATA TYPE TEXT,
ALTER COLUMN "educationLevel" DROP NOT NULL,
ALTER COLUMN "educationLevel" DROP DEFAULT,
ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Staff_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "address" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "firstname" SET DATA TYPE TEXT,
ALTER COLUMN "lastname" SET DATA TYPE TEXT,
ALTER COLUMN "phoneNumber" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- DropTable
DROP TABLE "StaffsOnDepartments";

-- DropTable
DROP TABLE "StaffsOnPositions";

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionStaff" (
    "positionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "PositionStaff_pkey" PRIMARY KEY ("positionId","staffId")
);

-- CreateTable
CREATE TABLE "StaffOnDepartment" (
    "staffId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "StaffOnDepartment_pkey" PRIMARY KEY ("staffId","departmentId")
);

-- CreateTable
CREATE TABLE "MedicalRoomTime" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fromTime" TIMESTAMP(3) NOT NULL,
    "toTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRoomTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTime" (
    "id" TEXT NOT NULL,
    "medicalRoomTimeId" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,

    CONSTRAINT "BookingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusLog" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" "APPOINTMENTSTATUS" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "symptom" TEXT,
    "icdCode" TEXT,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDisease" (
    "userId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDisease_pkey" PRIMARY KEY ("userId","diseaseId")
);

-- CreateTable
CREATE TABLE "DiagnosisSuggestion" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "suggestedByAI" BOOLEAN NOT NULL DEFAULT true,
    "diseaseId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosisSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_walletAddress_key" ON "Account"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_bookingTimeId_key" ON "Appointment"("bookingTimeId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionStaff" ADD CONSTRAINT "PositionStaff_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionStaff" ADD CONSTRAINT "PositionStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffOnDepartment" ADD CONSTRAINT "StaffOnDepartment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffOnDepartment" ADD CONSTRAINT "StaffOnDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRoom" ADD CONSTRAINT "MedicalRoom_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRoom" ADD CONSTRAINT "MedicalRoom_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRoomTime" ADD CONSTRAINT "MedicalRoomTime_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MedicalRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTime" ADD CONSTRAINT "BookingTime_medicalRoomTimeId_fkey" FOREIGN KEY ("medicalRoomTimeId") REFERENCES "MedicalRoomTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTime" ADD CONSTRAINT "BookingTime_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftWorking" ADD CONSTRAINT "ShiftWorking_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftWorking" ADD CONSTRAINT "ShiftWorking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MedicalRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_medicalRoomId_fkey" FOREIGN KEY ("medicalRoomId") REFERENCES "MedicalRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bookingTimeId_fkey" FOREIGN KEY ("bookingTimeId") REFERENCES "BookingTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusLog" ADD CONSTRAINT "AppointmentStatusLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDisease" ADD CONSTRAINT "UserDisease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDisease" ADD CONSTRAINT "UserDisease_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestion" ADD CONSTRAINT "DiagnosisSuggestion_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisSuggestion" ADD CONSTRAINT "DiagnosisSuggestion_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
