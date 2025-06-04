import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isStaff } from '~/middlewares/auth/roles'
import {
  getAllDepartmentsController,
  getDepartmentByIdController,
  createDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  getDepartmentServicesController,
  getDepartmentStaffController,
  getDepartmentMedicalRoomsController,
  getDepartmentStatisticsController
} from '~/controllers/department.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { departmentValidation } from '~/middlewares/validation/departmentValidation'

const router = Router()

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     description: Get all hospital departments
 *     tags: [Department]
 *     parameters:
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 */
router.get('/', getAllDepartmentsController)

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create department
 *     description: Create a new department (admin only)
 *     tags: [Department, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentRequest'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 */
router.post('/', protect, isAdmin, departmentValidation, handleErrors, createDepartmentController)

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     description: Get department details by ID
 *     tags: [Department]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentDetail'
 *       404:
 *         description: Department not found
 */
router.get('/:id', getDepartmentByIdController)

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     summary: Update department
 *     description: Update department information (admin only)
 *     tags: [Department, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartmentRequest'
 *     responses:
 *       200:
 *         description: Department updated successfully
 */
router.put('/:id', protect, isAdmin, departmentValidation, handleErrors, updateDepartmentController)

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     summary: Delete department
 *     description: Delete a department (admin only)
 *     tags: [Department, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 */
router.delete('/:id', protect, isAdmin, deleteDepartmentController)

/**
 * @swagger
 * /departments/{id}/services:
 *   get:
 *     summary: Get department services
 *     description: Get all services available in a department
 *     tags: [Department]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Service'
 */
router.get('/:id/services', getDepartmentServicesController)

/**
 * @swagger
 * /departments/{id}/staff:
 *   get:
 *     summary: Get department staff
 *     description: Get all staff members in a department
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: string
 *         description: Filter by position ID
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StaffProfile'
 */
router.get('/:id/staff', protect, isStaff, getDepartmentStaffController)

/**
 * @swagger
 * /departments/{id}/rooms:
 *   get:
 *     summary: Get department medical rooms
 *     description: Get all medical rooms in a department
 *     tags: [Department]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Medical rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MedicalRoom'
 */
router.get('/:id/rooms', getDepartmentMedicalRoomsController)

/**
 * @swagger
 * /departments/{id}/statistics:
 *   get:
 *     summary: Get department statistics
 *     description: Get statistics for a department (staff only)
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Statistics retrieved successfully
 */
router.get('/:id/statistics', protect, isStaff, getDepartmentStatisticsController)

export default router
