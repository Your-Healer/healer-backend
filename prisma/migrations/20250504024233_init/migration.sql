/*
  Warnings:

  - You are about to drop the column `walletPrivateKey` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "walletPrivateKey",
ADD COLUMN     "walletMnemonic" VARCHAR(500);
