import { Request, Response, NextFunction } from 'express'
import UserService from '~/services/user.service'

const userService = UserService.getInstance()

export async function getUserProfileController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.user
    const user = await userService.getUserById(id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAppointmentHistoryController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.user
    const appointments = await userService.getAppointmentsHistory(id)

    return res.status(200).json(appointments)
  } catch (error) {
    console.error('Error fetching appointment history:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// export async function getUserDiseasesController(req: any, res: Response, next: NextFunction) {
//   try {
//     const { id } = req.user
//     const diseases = await userService.getUserDiseases(id)

//     return res.status(200).json(diseases)
//   } catch (error) {
//     console.error('Error fetching user diseases:', error)
//     return res.status(500).json({ error: 'Internal server error' })
//   }
// }
