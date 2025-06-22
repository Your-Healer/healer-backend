import { Router } from 'express'
import { pingController, checkHealerNetworkController, healthCheckController } from '~/controllers/ping.controller'

const router = Router()

router.get('/', pingController)

router.get('/health', healthCheckController)

router.get('/healer-network', checkHealerNetworkController)

export default router
