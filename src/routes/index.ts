import { notFoundError } from '~/middlewares/validation/handleErrors'
import AuthRouter from './auth'
import BlockchainRouter from './blockchain'
import PingRouter from './ping'
import UserRouter from './user'
import StaffRouter from './staff'
import AppointmentRouter from './appointment'
import DepartmentRouter from './department'
import ShiftRouter from './shift'
import PatientRouter from './patient'
import MedicalRouter from './medical'
import ServiceRouter from './service'
import AccountRouter from './account'
import SwaggerRouter from './swagger'
import PositionRouter from './position'
import RoleRouter from './role'

export default function initializeRoutes(app: any) {
  app.use('/api/v1/ping', PingRouter)
  app.use('/api/v1/blockchain', BlockchainRouter)
  app.use('/api/v1/auth', AuthRouter)
  app.use('/api/v1/users', UserRouter)
  app.use('/api/v1/staffs', StaffRouter)
  app.use('/api/v1/accounts', AccountRouter)
  app.use('/api/v1/departments', DepartmentRouter)
  app.use('/api/v1/appointments', AppointmentRouter)
  app.use('/api/v1/patients', PatientRouter)
  app.use('/api/v1/medical', MedicalRouter)
  app.use('/api/v1/services', ServiceRouter)
  app.use('/api/v1/shifts', ShiftRouter)
  app.use('/api/v1/positions', PositionRouter)
  app.use('/api/v1/roles', RoleRouter)
  app.use('/api/v1/swagger', SwaggerRouter)

  return app.use(notFoundError)
}
