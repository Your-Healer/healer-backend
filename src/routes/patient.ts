import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isDoctor, isReceptionist, isPatient } from '~/middlewares/auth/roles'
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
  deletePatientController
} from '~/controllers/patient.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { patientValidation, updatePatientValidation } from '~/middlewares/validation/patientValidation'

const router = Router()

// Protected routes - Patient access
router.post('/', protect, isPatient, patientValidation, handleErrors, createPatientController)
router.get('/user/:userId', protect, isPatient, getPatientsByUserIdController)
router.patch('/:id', protect, isPatient, updatePatientValidation, handleErrors, updatePatientController)

// Protected routes - Staff access (Receptionist, Doctor, Admin)
router.get('/', protect, getPatientsController)
router.get('/search', protect, searchPatientsController)
router.get('/:id', protect, getPatientByIdController)
router.get('/:id/appointments', protect, getPatientAppointmentHistoryController)
router.get('/:id/statistics', protect, getPatientStatisticsController)

// Protected routes - Doctor access
router.get('/:id/medical-history', protect, isDoctor, getPatientMedicalHistoryController)

// Protected routes - Admin access
router.delete('/:id', protect, isAdmin, deletePatientController)

export default router
