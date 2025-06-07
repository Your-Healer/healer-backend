import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isAdmin, isStaff } from '~/middlewares/auth/roles'
import {
  createStaffController,
  getAllStaffController,
  getStaffByIdController,
  updateStaffController,
  deleteStaffController,
  searchStaffController,
  getStaffProfileController,
  updateStaffProfileController,
  getStaffShiftsController,
  getStaffAppointmentsController,
  getStaffStatisticsController,
  getStaffWorkloadController,
  bulkAssignStaffController,
  bulkUpdateStaffController,
  getStaffByDepartmentController,
  getStaffByPositionController,
  getStaffPatientsController,
  getStaffScheduleController,
  getIndividualStaffWorkloadController
} from '~/controllers/staff.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

// Public routes
router.get('/:id', getStaffByIdController)

// Protected routes - Staff access
router.get('/profile', protect, isStaff, getStaffProfileController)
router.put('/profile', protect, isStaff, updateStaffProfileController)
router.get('/shifts', protect, isStaff, getStaffShiftsController)
router.get('/appointments', protect, isStaff, getStaffAppointmentsController)
router.get('/search', protect, isStaff, searchStaffController)

// Protected routes - Admin access
router.get('/', protect, isAdmin, getAllStaffController)
router.post('/', protect, isAdmin, handleErrors, createStaffController)
router.patch('/:id', protect, isAdmin, updateStaffController)
router.delete('/:id', protect, isAdmin, deleteStaffController)
router.get('/statistics', protect, isAdmin, getStaffStatisticsController)
router.get('/workload', protect, isAdmin, getStaffWorkloadController)
router.post('/bulk-assign', protect, isAdmin, bulkAssignStaffController)
router.patch('/bulk-update', protect, isAdmin, bulkUpdateStaffController)

// Department and position specific routes
router.get('/departments/:departmentId', getStaffByDepartmentController)
router.get('/positions/:positionId', getStaffByPositionController)

// Individual staff routes
router.get('/:id/patients', protect, getStaffPatientsController)
router.get('/:id/schedule', protect, getStaffScheduleController)
router.get('/:id/workload', protect, getIndividualStaffWorkloadController)

export default router
