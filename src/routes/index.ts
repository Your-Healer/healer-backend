import AuthRouter from './auth'
import { notFoundError } from '~/middlewares/validation/handleErrors'

export default function initializeRoutes(app: any) {
  app.use('/api/v1/auth', AuthRouter)

  return app.use(notFoundError)
}
