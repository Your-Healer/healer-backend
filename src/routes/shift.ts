import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  getShiftsController,
  getShiftByIdController,
  createShiftController,
  createBulkShiftsController,
  updateShiftController,
  deleteShiftController,
  getShiftsByDepartmentController,
  getShiftsByRoomController,
  getShiftStatisticsController,
  getShiftsByDateRangeController,
  getShiftsByStaffController
} from '~/controllers/shiftWorking.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

router.get('/', protect, getShiftsController)

router.post('/', protect, handleErrors, createShiftController)

router.post('/bulk', protect, handleErrors, createBulkShiftsController)

router.get('/statistics', protect, getShiftStatisticsController)

router.get('/date-range', protect, getShiftsByDateRangeController)

router.get('/department/:departmentId', protect, getShiftsByDepartmentController)

router.get('/room/:roomId', protect, getShiftsByRoomController)

router.get('/staff/:staffId', protect, getShiftsByStaffController)

router.get('/:id', protect, getShiftByIdController)

router.put('/:id', protect, handleErrors, updateShiftController)

router.delete('/:id', protect, deleteShiftController)

export default router
