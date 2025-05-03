import { Router } from 'express'

// import { loginValidation, signupValidation } from '../../middlewares/validation/inputValidation'
// import { createUser } from '../../controllesr/auth/createUser'
// import { loginUser } from '../../controllers/auth/loginUser'
import { handleErrors } from '../middlewares/validation/handleErrors'
import { registerController } from '~/controllers/auth.controller'
const router = Router()

// router.post('/login', loginValidation, handleErrors, loginUser)
router.post('/signup', handleErrors, registerController)

export default router
