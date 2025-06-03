import { StaffOnDepartment, PrismaClient } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class StaffOnDepartmentRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(staffOnDepartment: StaffOnDepartment): Promise<StaffOnDepartment> {
    return await this._prisma.staffOnDepartment.create({
      data: staffOnDepartment
    })
  }
}
