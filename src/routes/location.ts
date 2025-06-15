import { Router } from 'express'
import { protect } from '../middlewares/auth/index'
import { getLocationsController } from '~/controllers/location.controller'

const router = Router()

router.get('/', protect, getLocationsController)

export default router
