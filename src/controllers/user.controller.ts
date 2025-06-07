import { Request, Response, NextFunction } from 'express'
import UserService from '~/services/user.service'

const userService = UserService.getInstance()

export async function getUserProfileController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const user = await userService.getUserById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updateUserProfileController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const { firstname, lastname, phoneNumber, address } = req.body

    const user = await userService.updateUser(userId, {
      firstname,
      lastname,
      phoneNumber,
      address
    })

    return res.status(200).json({
      message: 'User profile updated successfully',
      user
    })
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getUsersController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { searchTerm, hasAppointments, page = 1, limit = 10 } = req.query

    const filter = {
      searchTerm: searchTerm as string,
      hasAppointments: hasAppointments === 'true' ? true : hasAppointments === 'false' ? false : undefined
    }

    const result = await userService.getUsers(filter, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getUserByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json(user)
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAppointmentHistoryController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const { page = 1, limit = 10 } = req.query

    const result = await userService.getUserAppointments(userId, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching appointment history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getUserPatientsController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const { page = 1, limit = 10 } = req.query

    const result = await userService.getUserPatients(userId, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching user patients:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deleteUserController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await userService.deleteUser(id)

    return res.status(200).json({
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getUserStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    const stats = await userService.getUserStatistics(userId as string)

    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching user statistics:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function searchUsersController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { searchTerm } = req.query
    const { page = 1, limit = 10 } = req.query

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' })
    }

    const result = await userService.searchUsers(
      searchTerm as string,
      parseInt(page as string),
      parseInt(limit as string)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error searching users:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
