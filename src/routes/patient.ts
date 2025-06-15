import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isReceptionist, isDoctor, isDepartmentHead, isMedicalStaff } from '~/middlewares/auth/positions'
import { isAdmin, isStaff, isPatient } from '~/middlewares/auth/roles'
import {
  createPatientController,
  updatePatientController,
  getPatientByIdController,
  getPatientsController,
  getPatientsByUserIdController,
  searchPatientsController,
  getPatientAppointmentHistoryController,
  getPatientStatisticsController,
  getPatientMedicalHistoryController,
  deletePatientController,
  getCurrentPatientController,
  getPatientProfileController
} from '~/controllers/patient.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

// Public routes (with authentication)
router.get('/', protect, getPatientsController)
router.get('/search', protect, searchPatientsController)

// Patient-specific routes
router.get('/me', protect, getCurrentPatientController)
router.get('/profile', protect, getPatientProfileController)

// Patient management - Staff access required
router.post('/', protect, handleErrors, createPatientController)

// Get patients by user ID - Staff or own user
router.get('/user/:userId', protect, getPatientsByUserIdController)

// Individual patient operations
router.get('/:id', protect, getPatientByIdController)
router.patch('/:id', protect, handleErrors, updatePatientController)
router.delete('/:id', protect, deletePatientController)

// Patient appointment history - Staff or own patient
router.get('/:id/appointments', protect, getPatientAppointmentHistoryController)

// Patient statistics - Staff access required
router.get('/:id/statistics', protect, getPatientStatisticsController)

// Patient medical history - Doctor access required
router.get('/:id/medical-history', protect, getPatientMedicalHistoryController)

export default router
