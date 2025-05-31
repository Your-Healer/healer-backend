import { Router } from 'express'

import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../../swagger.json'

const router = Router()

router.use('/api-docs', swaggerUi.serve)
router.get(
  '/api-docs',
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      requestInterceptor: (request: any) => {
        return request
      },
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true
    }
  })
)

export default router
