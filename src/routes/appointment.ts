import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isDoctor, isPatient, isReceptionist } from '~/middlewares/auth/roles'
import {
  createAppointmentController,
  updateAppointmentStatusController,
  getAppointmentByIdController,
  addDiagnosisController,
  getAvailableTimeSlotsController
} from '~/controllers/appointment.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  appointmentValidation,
  statusUpdateValidation,
  diagnosisValidation
} from '~/middlewares/validation/appointmentValidation'

const router = Router()

// Public routes
router.get('/available-slots/:medicalRoomId', getAvailableTimeSlotsController)

// Protected routes
router.post('/', protect, isPatient, appointmentValidation, handleErrors, createAppointmentController)
router.get('/:id', protect, getAppointmentByIdController)
router.patch(
  '/:id/status',
  protect,
  isReceptionist,
  statusUpdateValidation,
  handleErrors,
  updateAppointmentStatusController
)
router.post('/:appointmentId/diagnosis', protect, isDoctor, diagnosisValidation, handleErrors, addDiagnosisController)

export default router
