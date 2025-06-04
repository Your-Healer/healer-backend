import { Request, Response, NextFunction } from 'express'
import MedicalService from '~/services/medical.service'

const medicalService = MedicalService.getInstance()

export async function createServiceController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Service name is required' })
    }

    const service = await medicalService.createService(name, description)

    return res.status(201).json({
      message: 'Service created successfully',
      service
    })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updateServiceController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const service = await medicalService.updateService(id, name, description)

    return res.status(200).json({
      message: 'Service updated successfully',
      service
    })
  } catch (error: any) {
    console.error('Error updating service:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getServicesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10 } = req.query

    const result = await medicalService.getServices(parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deleteServiceController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await medicalService.deleteService(id)

    return res.status(200).json({
      message: 'Service deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function createMedicalRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, serviceId, floor, name } = req.body

    if (!departmentId || !serviceId || !name || floor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const room = await medicalService.createMedicalRoom({
      departmentId,
      serviceId,
      floor,
      name
    })

    return res.status(201).json({
      message: 'Medical room created successfully',
      room
    })
  } catch (error: any) {
    console.error('Error creating medical room:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updateMedicalRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { departmentId, serviceId, floor, name } = req.body

    const room = await medicalService.updateMedicalRoom(id, {
      departmentId,
      serviceId,
      floor,
      name
    })

    return res.status(200).json({
      message: 'Medical room updated successfully',
      room
    })
  } catch (error: any) {
    console.error('Error updating medical room:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getMedicalRoomsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, serviceId, floor, searchTerm, page = 1, limit = 10 } = req.query

    const filter = {
      departmentId: departmentId as string,
      serviceId: serviceId as string,
      floor: floor ? parseInt(floor as string) : undefined,
      searchTerm: searchTerm as string
    }

    const result = await medicalService.getMedicalRooms(filter, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching medical rooms:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getMedicalRoomByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const room = await medicalService.getMedicalRoomById(id)

    if (!room) {
      return res.status(404).json({ error: 'Medical room not found' })
    }

    return res.status(200).json(room)
  } catch (error: any) {
    console.error('Error fetching medical room:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deleteMedicalRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await medicalService.deleteMedicalRoom(id)

    return res.status(200).json({
      message: 'Medical room deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting medical room:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function createTimeSlotController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, fromTime, toTime } = req.body

    if (!roomId || !fromTime || !toTime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const timeSlot = await medicalService.createTimeSlot({
      roomId,
      fromTime: new Date(fromTime),
      toTime: new Date(toTime)
    })

    return res.status(201).json({
      message: 'Time slot created successfully',
      timeSlot
    })
  } catch (error: any) {
    console.error('Error creating time slot:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function createBulkTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, dates, timeSlots } = req.body

    if (!roomId || !Array.isArray(dates) || !Array.isArray(timeSlots)) {
      return res.status(400).json({ error: 'Missing required fields or invalid format' })
    }

    const dateObjects = dates.map((date) => new Date(date))
    const slots = await medicalService.createBulkTimeSlots(roomId, dateObjects, timeSlots)

    return res.status(201).json({
      message: 'Bulk time slots created successfully',
      count: slots.length,
      timeSlots: slots
    })
  } catch (error: any) {
    console.error('Error creating bulk time slots:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, departmentId, date, fromTime, toTime, available, page = 1, limit = 10 } = req.query

    const filter = {
      roomId: roomId as string,
      departmentId: departmentId as string,
      date: date ? new Date(date as string) : undefined,
      fromTime: fromTime ? new Date(fromTime as string) : undefined,
      toTime: toTime ? new Date(toTime as string) : undefined,
      available: available === 'true' ? true : available === 'false' ? false : undefined
    }

    const result = await medicalService.getTimeSlots(filter, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching time slots:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAvailableTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, serviceId, date } = req.query

    const availableSlots = await medicalService.getAvailableTimeSlots(
      departmentId as string,
      serviceId as string,
      date ? new Date(date as string) : undefined
    )

    return res.status(200).json(availableSlots)
  } catch (error: any) {
    console.error('Error fetching available time slots:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deleteTimeSlotController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await medicalService.deleteTimeSlot(id)

    return res.status(200).json({
      message: 'Time slot deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting time slot:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getMedicalStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.query
    const stats = await medicalService.getMedicalStatistics(departmentId as string)

    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching medical statistics:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
