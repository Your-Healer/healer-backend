import { PrismaClient, MedicalRoomTime } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class MedicalRoomTimeRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(medicalRoomTime: MedicalRoomTime): Promise<MedicalRoomTime> {
    return await this._prisma.medicalRoomTime.create({
      data: medicalRoomTime
    })
  }
}
