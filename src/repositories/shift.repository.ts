import { PrismaClient, ShiftWorking } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class ShiftRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(shiftWorking: ShiftWorking): Promise<ShiftWorking> {
    return await this._prisma.shiftWorking.create({
      data: shiftWorking
    })
  }
}
