import { body } from 'express-validator'

export const registerValidation = [
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

  body('firstname')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastname')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Phone number must be 10-11 digits'),

  body('address').optional().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters')
]

export const loginUsernameValidation = [
  body('username').notEmpty().withMessage('Username is required').trim(),

  body('password').notEmpty().withMessage('Password is required')
]

export const loginEmailValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('password').notEmpty().withMessage('Password is required')
]

export const loginPhoneValidation = [
  body('phoneNumber')
    .matches(/^[0-9]{10,11}$/)
    .withMessage('Please provide a valid phone number'),

  body('password').notEmpty().withMessage('Password is required')
]

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('resetToken').notEmpty().withMessage('Reset token is required')
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

export const verifyEmailValidation = [body('token').notEmpty().withMessage('Verification token is required')]
