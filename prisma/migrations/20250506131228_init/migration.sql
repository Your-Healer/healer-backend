/*
  Warnings:

  - You are about to alter the column `email` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - A unique constraint covering the columns `[username]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "email" SET DATA TYPE VARCHAR(300);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");
