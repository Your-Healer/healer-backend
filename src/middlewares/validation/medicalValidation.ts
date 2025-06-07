import { body, query } from 'express-validator'

export const medicalRoomValidation = [
  body('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isUUID()
    .withMessage('Department ID must be a valid UUID'),

  body('serviceId')
    .notEmpty()
    .withMessage('Service ID is required')
    .isUUID()
    .withMessage('Service ID must be a valid UUID'),

  body('floor').isInt({ min: 0, max: 50 }).withMessage('Floor must be a number between 0 and 50'),

  body('name')
    .notEmpty()
    .withMessage('Room name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters')
]

export const updateMedicalRoomValidation = [
  body('departmentId').optional().isUUID().withMessage('Department ID must be a valid UUID'),

  body('serviceId').optional().isUUID().withMessage('Service ID must be a valid UUID'),

  body('floor').optional().isInt({ min: 0, max: 50 }).withMessage('Floor must be a number between 0 and 50'),

  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Room name must be between 1 and 100 characters')
]

export const timeSlotValidation = [
  body('roomId').notEmpty().withMessage('Room ID is required').isUUID().withMessage('Room ID must be a valid UUID'),

  body('fromTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('toTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.fromTime)) {
        throw new Error('End time must be after start time')
      }
      return true
    })
]

export const bulkTimeSlotValidation = [
  body('roomId').notEmpty().withMessage('Room ID is required').isUUID().withMessage('Room ID must be a valid UUID'),

  body('dates').isArray({ min: 1 }).withMessage('Dates array is required and must contain at least one date'),

  body('dates.*').isISO8601().withMessage('Each date must be a valid ISO 8601 date'),

  body('timeSlots').isArray({ min: 1 }).withMessage('Time slots array is required and must contain at least one slot'),

  body('timeSlots.*.startHour').isInt({ min: 0, max: 23 }).withMessage('Start hour must be between 0 and 23'),

  body('timeSlots.*.endHour').isInt({ min: 1, max: 24 }).withMessage('End hour must be between 1 and 24'),

  body('timeSlots.*.slotDuration')
    .isInt({ min: 15, max: 240 })
    .withMessage('Slot duration must be between 15 and 240 minutes')
]

export const serviceValidation = [
  body('name')
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),

  body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

  body('durationTime').optional().isInt({ min: 0 }).withMessage('Duration time must be a non-negative integer'),

  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number')
]

export const updateServiceValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),

  body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),

  body('durationTime').optional().isInt({ min: 0 }).withMessage('Duration time must be a non-negative integer'),

  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number')
]

export const timeSlotQueryValidation = [
  query('roomId').optional().isUUID().withMessage('Room ID must be a valid UUID'),

  query('departmentId').optional().isUUID().withMessage('Department ID must be a valid UUID'),

  query('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),

  query('fromTime').optional().isISO8601().withMessage('From time must be a valid ISO 8601 date'),

  query('toTime').optional().isISO8601().withMessage('To time must be a valid ISO 8601 date'),

  query('available').optional().isBoolean().withMessage('Available must be a boolean value'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
]
