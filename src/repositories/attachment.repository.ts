import { PrismaClient, Attachment } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class AttachmentRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(attachment: Attachment): Promise<Attachment> {
    return await this._prisma.attachment.create({
      data: attachment
    })
  }
}
