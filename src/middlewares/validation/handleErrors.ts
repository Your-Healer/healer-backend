import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'
import { logger } from '~/configs/logger'

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
