/*
  Warnings:

  - You are about to drop the `guides` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "guides" DROP CONSTRAINT "guides_plantId_fkey";

-- DropTable
DROP TABLE "guides";
