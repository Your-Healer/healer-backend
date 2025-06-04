import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isDepartmentHead } from '~/middlewares/auth/roles'
import { isDoctor, isDepartmentHead as isDeptHeadPosition } from '~/middlewares/auth/positions'
import {
  getAllShiftsController,
  getShiftByIdController,
  createShiftController,
  updateShiftController,
  deleteShiftController,
  getShiftsByDateRangeController,
  getShiftsByDepartmentController,
  getShiftsByStaffController,
  bulkCreateShiftsController,
  getShiftStatisticsController,
  assignShiftController,
  swapShiftsController
} from '~/controllers/shiftWorking.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  shiftValidation,
  bulkShiftValidation,
  shiftAssignValidation,
  shiftSwapValidation
} from '~/middlewares/validation/shiftValidation'

const router = Router()

/**
 * @swagger
 * /shifts:
 *   get:
 *     summary: Get all shifts
 *     description: Get all shifts with filtering options (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedShifts'
 */
router.get('/', protect, isDeptHeadPosition, getAllShiftsController)

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create shift
 *     description: Create a new shift (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShiftRequest'
 *     responses:
 *       201:
 *         description: Shift created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Invalid input or scheduling conflict
 */
router.post('/', protect, isDeptHeadPosition, shiftValidation, handleErrors, createShiftController)

/**
 * @swagger
 * /shifts/bulk:
 *   post:
 *     summary: Create multiple shifts
 *     description: Create multiple shifts at once (admin only)
 *     tags: [Shift, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shifts]
 *             properties:
 *               shifts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ShiftRequest'
 *     responses:
 *       201:
 *         description: Shifts created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: integer
 *                   example: 5
 *                 failed:
 *                   type: integer
 *                   example: 0
 *                 shifts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shift'
 */
router.post('/bulk', protect, isAdmin, bulkShiftValidation, handleErrors, bulkCreateShiftsController)

/**
 * @swagger
 * /shifts/assign:
 *   post:
 *     summary: Assign shift to staff
 *     description: Assign an existing shift to a staff member (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shiftId, staffId]
 *             properties:
 *               shiftId:
 *                 type: string
 *                 example: "shift-123"
 *               staffId:
 *                 type: string
 *                 example: "staff-456"
 *     responses:
 *       200:
 *         description: Shift assigned successfully
 */
router.post('/assign', protect, isDeptHeadPosition, shiftAssignValidation, handleErrors, assignShiftController)

/**
 * @swagger
 * /shifts/swap:
 *   post:
 *     summary: Swap shifts between staff
 *     description: Swap shifts between two staff members (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shift1Id, shift2Id]
 *             properties:
 *               shift1Id:
 *                 type: string
 *                 example: "shift-123"
 *               shift2Id:
 *                 type: string
 *                 example: "shift-456"
 *     responses:
 *       200:
 *         description: Shifts swapped successfully
 */
router.post('/swap', protect, isDeptHeadPosition, shiftSwapValidation, handleErrors, swapShiftsController)

/**
 * @swagger
 * /shifts/statistics:
 *   get:
 *     summary: Get shift statistics
 *     description: Get shift statistics and analytics (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiftStatistics'
 */
router.get('/statistics', protect, isDeptHeadPosition, getShiftStatisticsController)

/**
 * @swagger
 * /shifts/date-range:
 *   get:
 *     summary: Get shifts by date range
 *     description: Get shifts within a specific date range
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 */
router.get('/date-range', protect, isDoctor, getShiftsByDateRangeController)

/**
 * @swagger
 * /shifts/department/{departmentId}:
 *   get:
 *     summary: Get shifts by department
 *     description: Get all shifts for a specific department
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 */
router.get('/department/:departmentId', protect, isDoctor, getShiftsByDepartmentController)

/**
 * @swagger
 * /shifts/staff/{staffId}:
 *   get:
 *     summary: Get shifts by staff
 *     description: Get all shifts for a specific staff member
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 */
router.get('/staff/:staffId', protect, isDoctor, getShiftsByStaffController)

/**
 * @swagger
 * /shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     description: Get shift details by ID
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShiftDetail'
 *       404:
 *         description: Shift not found
 */
router.get('/:id', protect, isDoctor, getShiftByIdController)

/**
 * @swagger
 * /shifts/{id}:
 *   put:
 *     summary: Update shift
 *     description: Update shift information (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShiftRequest'
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       404:
 *         description: Shift not found
 */
router.put('/:id', protect, isDeptHeadPosition, shiftValidation, handleErrors, updateShiftController)

/**
 * @swagger
 * /shifts/{id}:
 *   delete:
 *     summary: Delete shift
 *     description: Delete a shift (admin/department head only)
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 *       404:
 *         description: Shift not found
 */
router.delete('/:id', protect, isDeptHeadPosition, deleteShiftController)

export default router
