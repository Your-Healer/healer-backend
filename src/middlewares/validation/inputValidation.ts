import { body, query, param, oneOf } from 'express-validator'

export const signupValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('email').isEmail().withMessage('Email is invalid'),
  body('firstname').notEmpty().withMessage('Firstname is required'),
  body('lastname').notEmpty().withMessage('Lastname is required')
]

export const loginUsernameValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
]

export const loginEmailValidation = [
  body('email').isEmail().withMessage('Email is invalid'),
  body('password').notEmpty().withMessage('Password is required')
]

export const loginPhoneNumberValidation = [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .escape()
    .exists({ checkFalsy: true })
    .isLength({ min: 11, max: 11 })
    .matches(/^(09|\+639)\d{9}$/),
  body('password').notEmpty().withMessage('Password is required')
]
