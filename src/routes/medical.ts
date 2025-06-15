import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
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

const router = Router()

// Public routes
router.get('/rooms', getMedicalRoomsController)
router.get('/rooms/:id', getMedicalRoomByIdController)
router.get('/time-slots/available', getAvailableTimeSlotsController)
router.get('/time-slots', getTimeSlotsController)

// Protected routes - Receptionist access
router.post('/rooms', protect, handleErrors, createMedicalRoomController)
router.patch('/rooms/:id', protect, handleErrors, updateMedicalRoomController)
router.post('/time-slots', protect, handleErrors, createTimeSlotController)
router.post('/time-slots/bulk', protect, handleErrors, createBulkTimeSlotsController)
router.delete('/time-slots/:id', protect, deleteTimeSlotController)
router.get('/rooms/:id/schedule', getMedicalRoomScheduleController)
router.get('/departments/:departmentId/schedule', getDepartmentScheduleController)
router.post('/time-slots/check-availability', checkTimeSlotAvailabilityController)
router.patch('/time-slots/:id', protect, handleErrors, updateTimeSlotController)

// Protected routes - Admin access
router.delete('/rooms/:id', protect, deleteMedicalRoomController)
router.get('/statistics', protect, getMedicalStatisticsController)
router.get('/rooms/:id/utilization', protect, getRoomUtilizationController)
router.get('/services/popularity', protect, getServicePopularityController)
router.delete('/time-slots/bulk', protect, bulkDeleteTimeSlotsController)
router.get('/room-types', getMedicalRoomTypesController)
router.get('/departments/:departmentId/floors/:floor/rooms', getMedicalRoomsByFloorController)

export default router
