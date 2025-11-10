/*
  Warnings:

  - The `sentences` column on the `Content` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "sentences",
ADD COLUMN     "sentences" JSONB;
