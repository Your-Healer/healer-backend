import { PrismaClient, Account } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class AccountRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(account: Account): Promise<Account> {
    return await this._prisma.account.create({
      data: account
    })
  }
}
