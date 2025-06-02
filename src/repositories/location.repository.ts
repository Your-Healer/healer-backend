import { PrismaClient, Attachment, Location } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class LocationRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(location: Location): Promise<Location> {
    return await this._prisma.location.create({
      data: location
    })
  }
}
