import { Router } from 'express'
import {
  pingController,
  checkHealerNetworkController,
  uploadSingleFileController,
  uploadMultipleFilesController,
  healthCheckController
} from '~/controllers/ping.controller'

const router = Router()

router.get('/', pingController)

router.get('/health', healthCheckController)

router.get('/healer-network', checkHealerNetworkController)

router.post('/upload/single', uploadSingleFileController)

router.post('/upload/multiple', uploadMultipleFilesController)

export default router
