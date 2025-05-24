import { Router } from 'express'

import {
  loginEmailValidation,
  loginUsernameValidation,
  signupValidation
} from '~/middlewares/validation/inputValidation'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { loginPhoneNumberValidation } from '../middlewares/validation/inputValidation'
import {
  loginPhoneNumberController,
  registerController,
  loginUsernameController,
  loginEmailController,
  logoutController
} from '~/controllers/auth.controller'
import { protect } from '~/middlewares/auth'

const router = Router()

router.post('/signup', signupValidation, handleErrors, registerController)
router.post('/login/username', loginUsernameValidation, handleErrors, loginUsernameController)
router.post('/login/email', loginEmailValidation, handleErrors, loginEmailController)
router.post('/login/phone', loginPhoneNumberValidation, handleErrors, loginPhoneNumberController)
router.post('/logout', protect, logoutController)

export default router
