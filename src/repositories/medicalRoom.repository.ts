import { PrismaClient, MedicalRoom } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class MedicalRoomRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(medicalRoom: MedicalRoom): Promise<MedicalRoom> {
    return await this._prisma.medicalRoom.create({
      data: medicalRoom
    })
  }
}
