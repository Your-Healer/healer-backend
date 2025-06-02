-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "description" TEXT,
ADD COLUMN     "durationTime" INTEGER NOT NULL DEFAULT 0;
