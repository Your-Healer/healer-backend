import prisma from '~/libs/prisma/init'
import BaseService from './base.service'
import { Attachment } from '@prisma/client'
import envConfigs from '~/configs/env/index'
import supabaseConfig from '~/configs/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import mime from 'mime-types'
import { SerializedAttachment } from '~/utils/types'

export default class AttachmentService extends BaseService {
  private static instance: AttachmentService
  private supabase: SupabaseClient
  private constructor() {
    super()
    this.supabase = supabaseConfig
  }

  public static getInstance(): AttachmentService {
    if (!AttachmentService.instance) {
      AttachmentService.instance = new AttachmentService()
    }
    return AttachmentService.instance
  }

  public async uploadSingleFile(file: Express.Multer.File): Promise<{ attachment: SerializedAttachment; url: string }> {
    try {
      const directory = 'your-healer-bucket'
      const fileName = file.originalname
      const mediaType = mime.lookup(fileName) || 'application/octet-stream'
      const fileBuffer = file.buffer
      const fileLength = BigInt(file.size)
      const uniquePath = `${Date.now()}-${randomUUID()}-${fileName}`

      const { error: uploadError } = await this.supabase.storage.from(directory).upload(uniquePath, fileBuffer, {
        contentType: mediaType,
        upsert: true
      })

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`)
      }

      const { data: publicUrlData } = this.supabase.storage.from(directory).getPublicUrl(uniquePath)

      const attachment = await prisma.attachment.create({
        data: {
          fileName,
          directory,
          length: fileLength,
          mediaType
        }
      })

      const formattedAttachment: SerializedAttachment = {
        ...attachment,
        length: fileLength.toString()
      }

      return {
        attachment: formattedAttachment,
        url: publicUrlData.publicUrl
      }
    } catch (error) {
      this.handleError(error, 'AttachmentService.uploadSingleFile')
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[]
  ): Promise<{ attachments: SerializedAttachment[]; urls: string[] }> {
    try {
      const directory = 'your-healer-bucket'
      const attachments: SerializedAttachment[] = []
      const urls: string[] = []

      for (const file of files) {
        const fileName = file.originalname
        const mediaType = mime.lookup(fileName) || 'application/octet-stream'
        const fileBuffer = file.buffer
        const fileLength = BigInt(file.size)
        const uniquePath = `${Date.now()}-${randomUUID()}-${fileName}`

        const { error: uploadError } = await this.supabase.storage.from(directory).upload(uniquePath, fileBuffer, {
          contentType: mediaType,
          upsert: true
        })

        if (uploadError) {
          throw new Error(`Supabase upload failed for ${fileName}: ${uploadError.message}`)
        }

        const { data: publicUrlData } = this.supabase.storage.from(directory).getPublicUrl(uniquePath)

        const attachment = await prisma.attachment
          .create({
            data: {
              fileName,
              directory,
              length: fileLength,
              mediaType
            }
          })
          .then((attachment) => ({
            ...attachment,
            length: fileLength.toString()
          }))

        attachments.push(attachment)
        urls.push(publicUrlData.publicUrl)
      }

      return { attachments, urls }
    } catch (error) {
      this.handleError(error, 'AttachmentService.uploadMultipleFiles')
    }
  }

  public async getAttachmentById(attachmentId: string): Promise<SerializedAttachment | null> {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId }
      })
      if (!attachment) {
        return null
      }
      return {
        ...attachment,
        length: attachment.length.toString()
      }
    } catch (error) {
      this.handleError(error, 'AttachmentService.getAttachmentById')
    }
  }

  public async getAttachments(attachmentId?: string): Promise<SerializedAttachment[]> {
    try {
      const whereClause = attachmentId ? { id: attachmentId } : {}
      const attachments = await prisma.attachment
        .findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc'
          }
        })
        .then((attachments) =>
          attachments.map((attachment) => ({
            ...attachment,
            length: attachment.length.toString()
          }))
        )

      return attachments
    } catch (error) {
      this.handleError(error, 'AttachmentService.getAttachments')
    }
  }

  public extractFilesToUrls(attachments: SerializedAttachment[]): {
    attachments: SerializedAttachment[]
    urls: string[]
  } {
    const attachmentUrls = attachments.map((attachment) => this.extractFileToUrl(attachment).url, [])
    return {
      attachments,
      urls: attachmentUrls
    }
  }

  public extractFileToUrl(attachment: SerializedAttachment): {
    attachment: SerializedAttachment
    url: string
  } {
    if (!attachment || !attachment.directory || !attachment.fileName) {
      throw new Error('Invalid attachment data')
    }

    const baseUrl = envConfigs.secrets.supabase.url || 'http://localhost:54321'
    const storagePath = `${attachment.directory}//${attachment.fileName}`

    return {
      attachment,
      url: `${baseUrl}/storage/v1/object/public/${storagePath}`
    }
  }
}
