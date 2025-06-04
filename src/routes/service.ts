import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin } from '~/middlewares/auth/roles'
import {
  createServiceController,
  updateServiceController,
  getServicesController,
  getServiceByIdController,
  deleteServiceController,
  getAllServicesController
} from '~/controllers/service.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { serviceValidation, updateServiceValidation } from '~/middlewares/validation/serviceValidation'

const router = Router()

// Public routes
router.get('/', getServicesController)
router.get('/all', getAllServicesController)
router.get('/:id', getServiceByIdController)

// Protected routes - Admin access
router.post('/', protect, isAdmin, serviceValidation, handleErrors, createServiceController)
router.patch('/:id', protect, isAdmin, updateServiceValidation, handleErrors, updateServiceController)
router.delete('/:id', protect, isAdmin, deleteServiceController)

export default router
