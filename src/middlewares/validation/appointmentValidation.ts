import { body } from 'express-validator'
import { APPOINTMENTSTATUS } from '@prisma/client'

export const appointmentValidation = [
  body('medicalRoomId').notEmpty().withMessage('Medical room ID is required'),
  body('medicalRoomTimeId').notEmpty().withMessage('Medical room time ID is required')
]

export const statusUpdateValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(APPOINTMENTSTATUS))
    .withMessage('Invalid status value')
]

export const diagnosisValidation = [
  body('diseaseId').optional(),
  body('confidence')
    .notEmpty()
    .withMessage('Confidence is required')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence should be between 0 and 1'),
  body('suggestedByAI').isBoolean().optional()
]
