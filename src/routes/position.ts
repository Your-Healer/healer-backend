import { Router } from 'express'
import { getPositionsController } from '~/controllers/position.controller'
import { protect } from '~/middlewares/auth/index'
import { isReceptionist, isDoctor, isDepartmentHead, isMedicalStaff } from '~/middlewares/auth/positions'
import { isAdmin, isStaff, isPatient } from '~/middlewares/auth/roles'

const router = Router()

router.get('/', protect, getPositionsController)

export default router
