import { PrismaClient, User } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class UserRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(user: User): Promise<User> {
    return await this._prisma.user.create({
      data: user
    })
  }
}
