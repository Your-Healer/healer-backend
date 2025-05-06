import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { logger } from '~/configs/logger'
import createErrors from 'http-errors'

const errorFormatter = ({
  location,
  message,
  params,
  values,
  nestedErrors
}: {
  location?: any
  message?: any
  params?: any
  values?: any
  nestedErrors?: any
}) => {
  return `${location}[${params}]: ${message}`
}

export const handleErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.error('Validation errors:', errors.array())
    res.status(400).json(errors)
  } else {
    next()
  }
}

export const badRequest = (err: any, res: Response) => {
  const error = createErrors.BadRequest(err)
  return res.status(error.status).json({
    error: true,
    code: error.status,
    message: err.message
  })
}

export const internalServerError = (req: Request, res: Response, next: NextFunction) => {
  const error = createErrors.InternalServerError()
  return res.status(error.status).json({
    error: true,
    code: error.status,
    message: error.message
  })
}

export const notFoundError = (req: Request, res: Response, next: NextFunction) => {
  const error = createErrors.NotFound()
  return res.status(error.status).json({
    error: true,
    code: error.status,
    message: error.message
  })
}

export const notAuthError = (err: any, res: Response) => {
  const error = createErrors.Unauthorized(err)
  return res.status(error.status).json({ error: true, code: error.status, message: error.message })
}
