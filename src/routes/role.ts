import { Router } from 'express'
import { getRolesController } from '~/controllers/role.controller'
import { protect } from '~/middlewares/auth/index'
import { isReceptionist, isDoctor, isDepartmentHead, isMedicalStaff } from '~/middlewares/auth/positions'
import { isAdmin, isStaff, isPatient } from '~/middlewares/auth/roles'

const router = Router()

router.get('/', protect, getRolesController)

export default router
