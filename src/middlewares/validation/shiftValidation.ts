import { body } from 'express-validator'

export const shiftValidation = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('fromTime').notEmpty().withMessage('From time is required').isISO8601().withMessage('Invalid date format'),
  body('toTime')
    .notEmpty()
    .withMessage('To time is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.fromTime)) {
        throw new Error('End time must be later than start time')
      }
      return true
    })
]
