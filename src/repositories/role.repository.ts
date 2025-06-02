import { PrismaClient, Role } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class RoleRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(role: Role): Promise<Role> {
    return await this._prisma.role.create({
      data: role
    })
  }
}
