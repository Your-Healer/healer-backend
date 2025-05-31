import { Router } from 'express'

import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../../swagger.json'
import cors from 'cors'
const router = Router()

router.use(cors())

router.use('/api-docs', swaggerUi.serve)
router.get(
  '/api-docs',
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      requestInterceptor: (request: any) => {
        request.headers.Origin = `http://localhost:3000`
        return request
      },
      url: `http://localhost:3000/docs/api-doc`
    }
  })
)

export default router
