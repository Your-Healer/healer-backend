-- CreateTable
CREATE TABLE "StaffsOnPositions" (
    "staffId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffsOnPositions_pkey" PRIMARY KEY ("staffId","positionId")
);

-- CreateTable
CREATE TABLE "StaffsOnDepartments" (
    "staffId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffsOnDepartments_pkey" PRIMARY KEY ("staffId","departmentId")
);

-- AddForeignKey
ALTER TABLE "StaffsOnPositions" ADD CONSTRAINT "StaffsOnPositions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffsOnPositions" ADD CONSTRAINT "StaffsOnPositions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffsOnDepartments" ADD CONSTRAINT "StaffsOnDepartments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffsOnDepartments" ADD CONSTRAINT "StaffsOnDepartments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
