import { PrismaClient, AppointmentStatusLog } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class AppointmentStatusLogRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(appointmentStatusLog: AppointmentStatusLog): Promise<AppointmentStatusLog> {
    return await this._prisma.appointmentStatusLog.create({
      data: appointmentStatusLog
    })
  }
}
