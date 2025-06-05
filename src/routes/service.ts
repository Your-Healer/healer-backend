import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  createBulkTimeSlotsController,
  createMedicalRoomController,
  createServiceController,
  createTimeSlotController,
  deleteMedicalRoomController,
  deleteServiceController,
  deleteTimeSlotController,
  getAvailableTimeSlotsController,
  getMedicalRoomByIdController,
  getMedicalRoomsController,
  getMedicalStatisticsController,
  getServicesController,
  getServiceByIdController,
  getTimeSlotsController,
  updateMedicalRoomController,
  updateServiceController
} from '~/controllers/service.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
const router = Router()

router.get('/', protect, handleErrors, getServicesController)

router.post('/', protect, handleErrors, createServiceController)

router.get('/:id', protect, handleErrors, getServiceByIdController)

router.post('/:id/timeslots', protect, handleErrors, createTimeSlotController)

router.post('/:id/timeslots/bulk', protect, handleErrors, createBulkTimeSlotsController)

router.delete('/:id/timeslots/:timeSlotId', protect, handleErrors, deleteTimeSlotController)

router.patch('/:id', protect, handleErrors, updateServiceController)

router.delete('/:id', protect, handleErrors, deleteServiceController)

router.get('/rooms', protect, handleErrors, getMedicalRoomsController)

router.get('/rooms/:id', protect, handleErrors, getMedicalRoomByIdController)

router.get('/rooms/:id/statistics', protect, handleErrors, getMedicalStatisticsController)

router.get('/rooms/:id/timeslots', protect, handleErrors, getTimeSlotsController)

router.get('/rooms/:id/timeslots/available', protect, handleErrors, getAvailableTimeSlotsController)

router.post('/rooms', protect, handleErrors, createMedicalRoomController)

router.put('/rooms/:id', protect, handleErrors, updateMedicalRoomController)

router.delete('/rooms/:id', protect, handleErrors, deleteMedicalRoomController)

export default router
