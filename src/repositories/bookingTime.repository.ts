import { PrismaClient, BookingTime } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class BookingTimeRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(bookingTime: BookingTime): Promise<BookingTime> {
    return await this._prisma.bookingTime.create({
      data: bookingTime
    })
  }
}
