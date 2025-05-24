/*
  Warnings:

  - You are about to drop the `_DepartmentToStaff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PositionToStaff` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DepartmentToStaff" DROP CONSTRAINT "_DepartmentToStaff_A_fkey";

-- DropForeignKey
ALTER TABLE "_DepartmentToStaff" DROP CONSTRAINT "_DepartmentToStaff_B_fkey";

-- DropForeignKey
ALTER TABLE "_PositionToStaff" DROP CONSTRAINT "_PositionToStaff_A_fkey";

-- DropForeignKey
ALTER TABLE "_PositionToStaff" DROP CONSTRAINT "_PositionToStaff_B_fkey";

-- DropTable
DROP TABLE "_DepartmentToStaff";

-- DropTable
DROP TABLE "_PositionToStaff";
