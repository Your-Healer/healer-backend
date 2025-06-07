import { body } from 'express-validator'

export const accountValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('roleId').notEmpty().withMessage('Role ID is required').isUUID().withMessage('Role ID must be a valid UUID'),

  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone number must be 10-11 digits'),

  body('avatarId').optional().isUUID().withMessage('Avatar ID must be a valid UUID')
]

export const updateAccountValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  body('email').optional().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone number must be 10-11 digits'),

  body('avatarId').optional().isUUID().withMessage('Avatar ID must be a valid UUID'),

  body('emailIsVerified').optional().isBoolean().withMessage('Email verification status must be a boolean')
]

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match')
    }
    return true
  })
]

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
]

export const checkExistsValidation = [
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),

  body('email').optional().isEmail().withMessage('Please provide a valid email address'),

  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone number must be 10-11 digits')
]
