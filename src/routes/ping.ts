import { Router } from 'express'
import {
  pingController,
  checkHealerNetworkController,
  uploadSingleFileController,
  uploadMultipleFilesController,
  getExtrinsicStatusController,
  healthCheckController
} from '~/controllers/ping.controller'

const router = Router()

router.get('/', pingController)

router.get('/health', healthCheckController)

router.get('/healer-network', checkHealerNetworkController)

router.post('/upload/single', uploadSingleFileController)

router.post('/upload/multiple', uploadMultipleFilesController)

router.get('/healer-network/extrinsic', getExtrinsicStatusController)

export default router
