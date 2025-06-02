import { Appointment, PrismaClient } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class AppointmentRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(appointment: Appointment): Promise<Appointment> {
    return await this._prisma.appointment.create({
      data: appointment
    })
  }
}
