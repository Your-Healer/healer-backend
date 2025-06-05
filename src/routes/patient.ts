import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
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

const router = Router()

router.post('/', protect, isPatient, handleErrors, createPatientController)
router.get('/user/:userId', protect, isPatient, getPatientsByUserIdController)
router.patch('/:id', protect, isPatient, handleErrors, updatePatientController)

router.get('/', protect, getPatientsController)
router.get('/search', protect, searchPatientsController)
router.get('/:id', protect, getPatientByIdController)
router.get('/:id/appointments', protect, getPatientAppointmentHistoryController)
router.get('/:id/statistics', protect, getPatientStatisticsController)

router.get('/:id/medical-history', protect, isDoctor, getPatientMedicalHistoryController)

router.delete('/:id', protect, isAdmin, deletePatientController)

export default router
