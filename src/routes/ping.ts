import { Router } from 'express'
import {
  pingController,
  checkHealerNetworkController,
  uploadSingleFileController,
  uploadMultipleFilesController,
  getExtrinsicStatusController
} from '~/controllers/ping.controller'

const router = Router()

/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Server Health Check
 *     description: Check if the server is up and running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is operational
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Hello World!"
 */
router.get('/', pingController)

router.get('/healer-network', checkHealerNetworkController)

router.post('/upload/single', uploadSingleFileController)

router.post('/upload/multiple', uploadMultipleFilesController)

router.get('/healer-network/extrinsic', getExtrinsicStatusController)

export default router
