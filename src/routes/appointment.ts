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

// Public routes
router.get('/check-availability/:medicalRoomTimeId', checkTimeSlotAvailabilityController)

// Protected routes - Admin access (place before generic routes)
router.get('/statistics', protect, isAdmin, getAppointmentStatisticsController)

// Protected routes - Staff access
router.get('/staff', protect, getAppointmentsByStaffController)
router.get('/upcoming', protect, getUpcomingAppointmentsController)
router.get('/', protect, getAppointmentsController)

// Protected routes - Patient access
router.post('/', protect, isPatient, appointmentValidation, handleErrors, createAppointmentController)
router.get('/patient/history', protect, isPatient, getPatientAppointmentHistoryController)
router.patch('/:id/cancel', protect, isPatient, cancelAppointmentController)

// Protected routes - Receptionist access
router.patch(
  '/:id/status',
  protect,
  isReceptionist,
  statusUpdateValidation,
  handleErrors,
  updateAppointmentStatusController
)

// Protected routes - Doctor access
router.post(
  '/:appointmentId/diagnosis',
  protect,
  isDoctor,
  diagnosisValidation,
  handleErrors,
  addDiagnosisSuggestionController
)
router.patch('/:id/complete', protect, isDoctor, completeAppointmentController)

// Generic routes (place last to avoid conflicts)
router.get('/:id', protect, getAppointmentByIdController)

export default router
