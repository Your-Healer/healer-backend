import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isPatient } from '~/middlewares/auth/roles'
import {
  getUserProfileController,
  getAppointmentHistoryController
  // getUserDiseasesController
} from '~/controllers/user.controller'

const router = Router()

// Protected user routes
router.get('/profile', protect, isPatient, getUserProfileController)
router.get('/appointments', protect, isPatient, getAppointmentHistoryController)
// router.get('/diseases', protect, isPatient, getUserDiseasesController)

export default router
