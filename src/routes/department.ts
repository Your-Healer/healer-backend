import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isDoctor, isDepartmentHead, isMedicalStaff, isNurse, isReceptionist } from '~/middlewares/auth/positions'
import { isAdmin, isPatient, isStaff, isUser, hasAnyRole } from '~/middlewares/auth/roles'
import {
  getDepartmentByIdController,
  getDepartmentsController,
  createDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  getDepartmentStaffController,
  getDepartmentMedicalRoomsController,
  getDepartmentStatisticsController,
  assignStaffToDepartmentController,
  bulkAssignStaffController,
  removeStaffFromDepartmentController
} from '~/controllers/department.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

router.get('/', getDepartmentsController)

router.post('/', protect, isAdmin, handleErrors, createDepartmentController)

router.get('/:id', getDepartmentByIdController)

router.put('/:id', protect, isAdmin, handleErrors, updateDepartmentController)

router.delete('/:id', protect, isAdmin, deleteDepartmentController)

router.get('/:id/staff', protect, isStaff, getDepartmentStaffController)

router.post('/:id/staff', protect, assignStaffToDepartmentController)

router.post('/:id/staffs', protect, bulkAssignStaffController)

router.delete('/:id/staff/:staffId', protect, removeStaffFromDepartmentController)

router.get('/:id/rooms', getDepartmentMedicalRoomsController)

router.get('/:id/statistics', protect, isStaff, getDepartmentStatisticsController)

export default router
