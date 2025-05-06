import { notFoundError } from '~/middlewares/validation/handleErrors'
import AuthRouter from './auth'
import PingRouter from './ping'

export default function initializeRoutes(app: any) {
  app.use('/api/v1/ping', PingRouter)

  app.use('/api/v1/auth', AuthRouter)

  return app.use(notFoundError)
}
