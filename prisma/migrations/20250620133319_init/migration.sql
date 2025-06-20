-- CreateEnum
CREATE TYPE "GENDER" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "gender" "GENDER";

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "gender" "GENDER";
