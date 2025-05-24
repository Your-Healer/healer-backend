import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isStaff, isDoctor } from '~/middlewares/auth/roles'
import {
  getStaffProfileController,
  getStaffShiftsController,
  getStaffPatientsController
} from '~/controllers/staff.controller'

const router = Router()

// Protected staff routes
router.get('/profile/:id', protect, isStaff, getStaffProfileController)
router.get('/shifts', protect, isStaff, getStaffShiftsController)
router.get('/patients', protect, isDoctor, getStaffPatientsController)

export default router
