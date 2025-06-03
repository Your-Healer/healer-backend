import { PrismaClient, Position } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class PositionRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(position: Position): Promise<Position> {
    return await this._prisma.position.create({
      data: position
    })
  }
}
