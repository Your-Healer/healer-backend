import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import AttachmentService from '~/services/attachment.service'

const attachmentService = AttachmentService.getInstance()

export async function uploadSingleFileController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    if (!req.file || Array.isArray(req.file)) {
      return res.status(400).json({ error: 'Expected a single file' })
    }

    const result = await attachmentService.uploadSingleFile(req.file)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    next(error)
  }
}

export async function uploadMultipleFilesController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'Expected multiple files' })
    }

    const uploadResults = await Promise.all(
      req.files.map((file: Express.Multer.File) => attachmentService.uploadSingleFile(file))
    )

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadResults
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    next(error)
  }
}

export async function getAttachmentsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const attachmentId = <string>req.query.attachmentId
    const attachments = await attachmentService.getAttachments(attachmentId)
    const formattedAttachments = attachmentService.extractFilesToUrls(attachments)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Attachments retrieved successfully',
      data: formattedAttachments
    })
  } catch (error) {
    console.error('Error retrieving attachments:', error)
    next(error)
  }
}
