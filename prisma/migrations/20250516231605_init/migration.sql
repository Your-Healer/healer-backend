/*
  Warnings:

  - A unique constraint covering the columns `[walletMnemonic]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `walletMnemonic` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "walletMnemonic" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_walletMnemonic_key" ON "Account"("walletMnemonic");
