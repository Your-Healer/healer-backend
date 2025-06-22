-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "iconId" TEXT;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
