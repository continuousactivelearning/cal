/*
  Warnings:

  - A unique constraint covering the columns `[studentId,courseInstanceId]` on the table `TotalProgress` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TotalProgress_studentId_courseInstanceId_key" ON "TotalProgress"("studentId", "courseInstanceId");
