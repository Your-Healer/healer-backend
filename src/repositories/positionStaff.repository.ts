import { PositionStaff, PrismaClient } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class PositionStaffRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(positionStaff: PositionStaff): Promise<PositionStaff> {
    return await this._prisma.positionStaff.create({
      data: positionStaff
    })
  }
}
