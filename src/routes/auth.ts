import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import {
  registerController,
  loginEmailController,
  loginPhoneNumberController,
  loginUsernameController,
  logoutController,
  refreshTokenController,
  // verifyEmailController,
  // requestPasswordResetController,
  // resetPasswordController,
  changePasswordController,
  getCurrentUserController
} from '~/controllers/auth.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  registerValidation,
  loginUsernameValidation,
  loginEmailValidation,
  loginPhoneValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  changePasswordValidation
} from '~/middlewares/validation/authValidation'

const router = Router()

router.post('/signup', registerValidation, handleErrors, registerController)

router.post('/login/username', loginUsernameValidation, handleErrors, loginUsernameController)

router.post('/login/email', loginEmailValidation, handleErrors, loginEmailController)

router.post('/login/phone', loginPhoneValidation, handleErrors, loginPhoneNumberController)

router.post('/logout', protect, logoutController)

router.post('/refresh-token', handleErrors, refreshTokenController)

// router.post('/verify-email', verifyEmailValidation, handleErrors, verifyEmailController)

// router.post('/forgot-password', handleErrors, requestPasswordResetController)

// router.post('/reset-password', resetPasswordValidation, handleErrors, resetPasswordController)

router.get('/me', protect, getCurrentUserController)

router.patch('/change-password', protect, changePasswordValidation, handleErrors, changePasswordController)

export default router
