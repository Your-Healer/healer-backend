import { Router } from 'express'

import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../../swagger.json'

const router = Router()

router.use('/api-docs', swaggerUi.serve)
router.get(
  '/api-docs',
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      requestInterceptor: (request: any) => {
        request.headers.Origin = '*'
        return request
      }
    }
  })
)

export default router
