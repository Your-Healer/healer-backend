import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isReceptionist } from '~/middlewares/auth/roles'
import {
  createShiftController,
  updateShiftController,
  deleteShiftController,
  getShiftsForRoomController,
  getShiftsForDepartmentController
} from '~/controllers/shift.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { shiftValidation } from '~/middlewares/validation/shiftValidation'

const router = Router()

// Protected routes - only admin and receptionist can manage shifts
router.post('/', protect, isReceptionist, shiftValidation, handleErrors, createShiftController)
router.put('/:id', protect, isReceptionist, shiftValidation, handleErrors, updateShiftController)
router.delete('/:id', protect, isReceptionist, deleteShiftController)

// Routes to view shifts
router.get('/room/:roomId', protect, getShiftsForRoomController)
router.get('/department/:departmentId', protect, getShiftsForDepartmentController)

export default router
