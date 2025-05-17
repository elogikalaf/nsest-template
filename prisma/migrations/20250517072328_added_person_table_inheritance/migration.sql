/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `isFirstLogin` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Developer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFirstLogin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `developerId` on the `VerifyCode` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `VerifyCode` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personId]` on the table `VerifyCode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "VerifyCode" DROP CONSTRAINT "VerifyCode_developerId_fkey";

-- DropForeignKey
ALTER TABLE "VerifyCode" DROP CONSTRAINT "VerifyCode_userId_fkey";

-- DropIndex
DROP INDEX "Developer_email_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "VerifyCode_developerId_idx";

-- DropIndex
DROP INDEX "VerifyCode_developerId_key";

-- DropIndex
DROP INDEX "VerifyCode_userId_idx";

-- DropIndex
DROP INDEX "VerifyCode_userId_key";

-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "isFirstLogin",
DROP COLUMN "isVerified",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "email",
DROP COLUMN "isFirstLogin",
DROP COLUMN "isVerified",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "VerifyCode" DROP COLUMN "developerId",
DROP COLUMN "userId",
ADD COLUMN     "personId" TEXT;

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerifyCode_personId_key" ON "VerifyCode"("personId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_fkey" FOREIGN KEY ("id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developer" ADD CONSTRAINT "Developer_id_fkey" FOREIGN KEY ("id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifyCode" ADD CONSTRAINT "VerifyCode_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
