import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  getStaffProfileController,
  createStaffController,
  getStaffShiftsController,
  getStaffPatientsController,
  updateStaffProfileController,
  getStaffAppointmentsController,
  getAllStaffController,
  searchStaffController,
  getStaffByIdController
} from '~/controllers/staff.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

router.get('/profile', protect, isStaff, getStaffProfileController)

router.put('/profile', protect, isStaff, handleErrors, updateStaffProfileController)

router.get('/shifts', protect, isStaff, getStaffShiftsController)

router.get('/appointments', protect, isStaff, getStaffAppointmentsController)

router.get('/', protect, isAdmin, getAllStaffController)

router.post('/', protect, isAdmin, handleErrors, createStaffController)

router.get('/search', protect, isStaff, searchStaffController)

router.get('/:id', getStaffByIdController)

router.get('/:id/patients', protect, getStaffPatientsController)

export default router
