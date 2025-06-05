import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  getUserProfileController,
  updateUserProfileController,
  getUserPatientsController,
  getUserStatisticsController,
  deleteUserController,
  searchUsersController,
  getAppointmentHistoryController,
  getUserByIdController,
  getUsersController
} from '~/controllers/user.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

router.get('/', protect, getUsersController)

router.get('/:id', protect, getUserByIdController)

router.delete('/:id', protect, deleteUserController)

router.get('/profile', protect, getUserProfileController)

router.put('/profile', protect, handleErrors, updateUserProfileController)

router.get('/appointments', protect, getAppointmentHistoryController)

router.get('/patients', protect, getUserPatientsController)

router.get('/statistics', protect, getUserStatisticsController)

router.get('/search', protect, searchUsersController)

export default router
