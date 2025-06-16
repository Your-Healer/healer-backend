import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  createAppointmentController,
  updateAppointmentStatusController,
  getAppointmentByIdController,
  addDiagnosisSuggestionController,
  cancelAppointmentController,
  checkTimeSlotAvailabilityController,
  completeAppointmentController,
  getAppointmentStatisticsController,
  getAppointmentsByStaffController,
  getAppointmentsController,
  getPatientAppointmentHistoryController,
  getUpcomingAppointmentsController
} from '~/controllers/appointment.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  appointmentValidation,
  statusUpdateValidation,
  diagnosisValidation
} from '~/middlewares/validation/appointmentValidation'

const router = Router()

router.get('/check-availability/:medicalRoomTimeId', checkTimeSlotAvailabilityController)

router.get('/statistics', protect, getAppointmentStatisticsController)

router.get('/staff', protect, getAppointmentsByStaffController)
router.get('/upcoming', protect, getUpcomingAppointmentsController)
router.get('/', protect, getAppointmentsController)

router.post('/', protect, handleErrors, createAppointmentController)
router.get('/:patientId/history', protect, getPatientAppointmentHistoryController)
router.patch('/:id/cancel', protect, cancelAppointmentController)

router.patch('/:id/status', protect, statusUpdateValidation, handleErrors, updateAppointmentStatusController)

router.post('/:appointmentId/diagnosis', protect, handleErrors, addDiagnosisSuggestionController)
router.patch('/:id/complete', protect, completeAppointmentController)

router.get('/:id', protect, getAppointmentByIdController)

export default router
