import { Router } from 'express'

// import { loginValidation, signupValidation } from '../../middlewares/validation/inputValidation'
// import { createUser } from '../../controllesr/auth/createUser'
// import { loginUser } from '../../controllers/auth/loginUser'
import { handleErrors } from '../../middlewares/validation/handleErrors'
const router = Router()

router.get('/', (req, res) => {
  res.send('ok')
})
// router.post('/login', loginValidation, handleErrors, loginUser)
// router.post('/signup', signupValidation, handleErrors, createUser)

export default router
