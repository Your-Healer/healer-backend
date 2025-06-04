import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isReceptionist } from '~/middlewares/auth/roles'
import {
  createMedicalRoomController,
  updateMedicalRoomController,
  getMedicalRoomByIdController,
  getMedicalRoomsController,
  deleteMedicalRoomController,
  createTimeSlotController,
  createBulkTimeSlotsController,
  getTimeSlotsController,
  getAvailableTimeSlotsController,
  deleteTimeSlotController,
  getMedicalStatisticsController,
  getRoomUtilizationController,
  getServicePopularityController,
  getMedicalRoomScheduleController,
  getDepartmentScheduleController,
  checkTimeSlotAvailabilityController,
  updateTimeSlotController,
  bulkDeleteTimeSlotsController,
  getMedicalRoomTypesController,
  getMedicalRoomsByFloorController
} from '~/controllers/medical.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  medicalRoomValidation,
  updateMedicalRoomValidation,
  timeSlotValidation,
  bulkTimeSlotValidation
} from '~/middlewares/validation/medicalValidation'

const router = Router()

// Public routes
router.get('/rooms', getMedicalRoomsController)
router.get('/rooms/:id', getMedicalRoomByIdController)
router.get('/time-slots/available', getAvailableTimeSlotsController)
router.get('/time-slots', getTimeSlotsController)

// Protected routes - Receptionist access
router.post('/rooms', protect, isReceptionist, medicalRoomValidation, handleErrors, createMedicalRoomController)
router.patch(
  '/rooms/:id',
  protect,
  isReceptionist,
  updateMedicalRoomValidation,
  handleErrors,
  updateMedicalRoomController
)
router.post('/time-slots', protect, isReceptionist, timeSlotValidation, handleErrors, createTimeSlotController)
router.post(
  '/time-slots/bulk',
  protect,
  isReceptionist,
  bulkTimeSlotValidation,
  handleErrors,
  createBulkTimeSlotsController
)
router.delete('/time-slots/:id', protect, isReceptionist, deleteTimeSlotController)
router.get('/rooms/:id/schedule', getMedicalRoomScheduleController)
router.get('/departments/:departmentId/schedule', getDepartmentScheduleController)
router.post('/time-slots/check-availability', checkTimeSlotAvailabilityController)
router.patch('/time-slots/:id', protect, isReceptionist, timeSlotValidation, handleErrors, updateTimeSlotController)

// Protected routes - Admin access
router.delete('/rooms/:id', protect, isAdmin, deleteMedicalRoomController)
router.get('/statistics', protect, isAdmin, getMedicalStatisticsController)
router.get('/rooms/:id/utilization', protect, isAdmin, getRoomUtilizationController)
router.get('/services/popularity', protect, isAdmin, getServicePopularityController)
router.delete('/time-slots/bulk', protect, isAdmin, bulkDeleteTimeSlotsController)
router.get('/room-types', getMedicalRoomTypesController)
router.get('/departments/:departmentId/floors/:floor/rooms', getMedicalRoomsByFloorController)

export default router
