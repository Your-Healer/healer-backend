import { Router } from 'express'

import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../../swagger.json'
import cors from 'cors'

const router = Router()

router.use(cors())

router.use('/api-docs', swaggerUi.serve)
router.get('/api-docs', swaggerUi.setup(swaggerDocument))

export default router
