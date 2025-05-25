import { notFoundError } from '~/middlewares/validation/handleErrors'
import AuthRouter from './auth'
import PingRouter from './ping'
import UserRouter from './user'
import StaffRouter from './staff'
import AppointmentRouter from './appointment'
import ShiftRouter from './shift'
import SwaggerRouter from './swagger'

export default function initializeRoutes(app: any) {
  app.use('/api/v1/ping', PingRouter)
  app.use('/api/v1/auth', AuthRouter)
  app.use('/api/v1/users', UserRouter)
  app.use('/api/v1/staff', StaffRouter)
  app.use('/api/v1/appointments', AppointmentRouter)
  app.use('/api/v1/shifts', ShiftRouter)
  app.use('/api/v1/swagger', SwaggerRouter)

  return app.use(notFoundError)
}
