import { PrismaClient, Staff } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class StaffRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(staff: Staff): Promise<Staff> {
    return await this._prisma.staff.create({
      data: staff
    })
  }
}
