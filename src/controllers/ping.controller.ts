import { Request, Response, NextFunction } from 'express'
import BlockchainService from '~/services/blockchain.service'

const blockchainService = BlockchainService.getInstance()

export async function checkHealerNetworkController(req: any, res: Response, next: NextFunction): Promise<any> {
  const status = await blockchainService.checkConnection()
  return res.status(200).json({
    status: status.status ? status.message : 'Healer Network is not connected',
    timestamp: new Date().toISOString()
  })
}
export function uploadSingleFileController(req: any, res: Response, next: NextFunction): any {
  return {
    message: 'Single file uploaded successfully',
    file: req.file,
    timestamp: new Date().toISOString()
  }
}
export function uploadMultipleFilesController(req: any, res: Response, next: NextFunction): any {
  return {
    message: 'Multiple files uploaded successfully',
    files: req.files,
    timestamp: new Date().toISOString()
  }
}

export const pingController = (req: Request, res: Response) => {
  res.status(200).send('Hello World!')
}

export const healthCheckController = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running properly'
  })
}
