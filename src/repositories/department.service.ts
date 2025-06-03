import { PrismaClient, Department } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class DepartmentRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(department: Department): Promise<Department> {
    return await this._prisma.department.create({
      data: department
    })
  }
}
