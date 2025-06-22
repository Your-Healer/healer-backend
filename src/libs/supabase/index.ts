import mime from 'mime-types'
import { randomUUID } from 'crypto'

interface ExtractedFile {
  fileName: string
  directory: string
  path: string
  mediaType: string
  fileBuffer: Buffer
  fileLength: bigint
}

export function extractFile(file: Express.Multer.File, directory = 'your-healer-bucket'): ExtractedFile {
  const fileName = file.originalname
  const fileBuffer = file.buffer
  const fileLength = BigInt(file.size)
  const mediaType = mime.lookup(fileName) || 'application/octet-stream'

  const uniqueFileName = `${Date.now()}-${randomUUID()}-${fileName}`
  const path = `uploads/${uniqueFileName}`

  return {
    fileName,
    directory,
    path,
    mediaType,
    fileBuffer,
    fileLength
  }
}
