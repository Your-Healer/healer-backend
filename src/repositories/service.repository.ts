import { PrismaClient, Service } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class ServiceRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(service: Service): Promise<Service> {
    return await this._prisma.service.create({
      data: service
    })
  }
}
