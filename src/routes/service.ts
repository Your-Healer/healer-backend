import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isReceptionist, isDoctor, isDepartmentHead, isMedicalStaff } from '~/middlewares/auth/positions'
import { isAdmin, isStaff } from '~/middlewares/auth/roles'
import {
  createServiceController,
  updateServiceController,
  getServiceByIdController,
  getServicesController,
  deleteServiceController,
  getAllServicesController
} from '~/controllers/service.controller'
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
  getMedicalStatisticsController
} from '~/controllers/medical.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

// Public routes
router.get('/', getServicesController)
router.get('/all', getAllServicesController)
router.get('/:id', getServiceByIdController)

// Service management - Staff access required
router.post('/', protect, handleErrors, createServiceController)
router.patch('/:id', protect, handleErrors, updateServiceController)
router.delete('/:id', protect, deleteServiceController)

// Service time slot management - Staff access required
router.post('/:id/timeslots', protect, handleErrors, createTimeSlotController)
router.post('/:id/timeslots/bulk', protect, handleErrors, createBulkTimeSlotsController)
router.delete('/:id/timeslots/:timeSlotId', protect, deleteTimeSlotController)

// Medical rooms management through services
router.get('/rooms', protect, getMedicalRoomsController)
router.post('/rooms', protect, handleErrors, createMedicalRoomController)
router.get('/rooms/:id', protect, getMedicalRoomByIdController)
router.put('/rooms/:id', protect, handleErrors, updateMedicalRoomController)
router.delete('/rooms/:id', protect, deleteMedicalRoomController)

// Room statistics - Staff access required
router.get('/rooms/:id/statistics', protect, getMedicalStatisticsController)

// Room time slots
router.get('/rooms/:id/timeslots', protect, getTimeSlotsController)
router.get('/rooms/:id/timeslots/available', protect, getAvailableTimeSlotsController)

export default router
