/*
  Warnings:

  - Added the required column `sectionId` to the `submitSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submitSession" ADD COLUMN     "sectionId" TEXT NOT NULL;
