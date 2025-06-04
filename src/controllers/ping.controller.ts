import { Request, Response, NextFunction } from 'express'

export function checkHealerNetworkController(req: any, res: Response, next: NextFunction): any {
  return {
    status: 'Healer Network is operational',
    timestamp: new Date().toISOString()
  }
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
export function getExtrinsicStatusController(req: any, res: Response, next: NextFunction): any {
  return {
    status: 'Extrinsic is pending',
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
