import { NextFunction, Request, Response } from 'express'
import MedicalService from '~/services/medical.service'

const medicalService = MedicalService.getInstance()

export async function createMedicalRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, serviceId, floor, name } = req.body

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
    return res.status(400).json({ error: error.message || 'Failed to create medical room' })
  }
}

export async function updateMedicalRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { departmentId, serviceId, floor, name } = req.body

    const updateData: any = {}
    if (departmentId) updateData.departmentId = departmentId
    if (serviceId) updateData.serviceId = serviceId
    if (floor !== undefined) updateData.floor = floor
    if (name) updateData.name = name

    const room = await medicalService.updateMedicalRoom(id, updateData)

    return res.status(200).json({
      message: 'Medical room updated successfully',
      room
    })
  } catch (error: any) {
    console.error('Error updating medical room:', error)
    return res.status(400).json({ error: error.message || 'Failed to update medical room' })
  }
}

export async function getMedicalRoomByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    const room = await medicalService.getMedicalRoomById(id)
    if (!room) {
      return res.status(404).json({ error: 'Medical room not found' })
    }

    return res.status(200).json({ room })
  } catch (error: any) {
    console.error('Error getting medical room:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getMedicalRoomsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10, departmentId, serviceId, floor, available, searchTerm } = req.query

    const filter: any = {}
    if (departmentId) filter.departmentId = departmentId as string
    if (serviceId) filter.serviceId = serviceId as string
    if (floor !== undefined) filter.floor = parseInt(floor as string)
    if (available !== undefined) filter.available = available === 'true'
    if (searchTerm) filter.searchTerm = searchTerm as string

    const result = await medicalService.getMedicalRooms({
      filter,
      page: Number(page),
      limit: Number(limit)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting medical rooms:', error)
    return res.status(500).json({ error: 'Internal server error' })
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
    return res.status(400).json({ error: error.message || 'Failed to delete medical room' })
  }
}

// Time Slot Controllers
export async function createTimeSlotController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, fromTime, toTime } = req.body

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
    return res.status(400).json({ error: error.message || 'Failed to create time slot' })
  }
}

export async function createBulkTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, dates, timeSlots } = req.body

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required and cannot be empty' })
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ error: 'Time slots array is required and cannot be empty' })
    }

    const dateObjects = dates.map((date) => new Date(date))
    const createdSlots = await medicalService.createBulkTimeSlots({
      roomId,
      dates: dateObjects,
      timeSlots
    })

    return res.status(201).json({
      message: `${createdSlots.length} time slots created successfully`,
      timeSlots: createdSlots,
      totalRequested:
        dates.length *
        timeSlots.reduce((total, slot) => {
          const duration = slot.endHour - slot.startHour
          const slotsPerTimeSlot = Math.floor(duration / (slot.slotDuration / 60))
          return total + slotsPerTimeSlot
        }, 0),
      totalCreated: createdSlots.length
    })
  } catch (error: any) {
    console.error('Error creating bulk time slots:', error)
    return res.status(400).json({ error: error.message || 'Failed to create bulk time slots' })
  }
}

export async function getTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10, id, roomId, departmentId, date, fromTime, toTime, available } = req.query

    const filter: any = {}
    if (id) filter.id = id as string
    if (roomId) filter.roomId = roomId as string
    if (departmentId) filter.departmentId = departmentId as string
    if (date) filter.date = new Date(date as string)
    if (fromTime) filter.fromTime = new Date(fromTime as string)
    if (toTime) filter.toTime = new Date(toTime as string)
    if (available !== undefined) filter.available = available === 'true'

    const result = await medicalService.getTimeSlots({
      filter,
      page: Number(page),
      limit: Number(limit)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting time slots:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAvailableTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, departmentId, serviceId, date } = req.query

    const availableSlots = await medicalService.getAvailableTimeSlots({
      roomId: roomId as string,
      departmentId: departmentId as string,
      serviceId: serviceId as string,
      date: date ? new Date(date as string) : undefined
    })

    return res.status(200).json({
      timeSlots: availableSlots,
      total: availableSlots.length
    })
  } catch (error: any) {
    console.error('Error getting available time slots:', error)
    return res.status(500).json({ error: 'Internal server error' })
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
    return res.status(400).json({ error: error.message || 'Failed to delete time slot' })
  }
}

// Statistics and Analytics Controllers
export async function getMedicalStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.query

    const statistics = await medicalService.getMedicalStatistics({
      departmentId: departmentId as string
    })

    return res.status(200).json({ statistics })
  } catch (error: any) {
    console.error('Error getting medical statistics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getRoomUtilizationController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { fromDate, toDate } = req.query

    const utilization = await medicalService.getRoomUtilization({
      roomId: id,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    })

    return res.status(200).json({ utilization })
  } catch (error: any) {
    console.error('Error getting room utilization:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getServicePopularityController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { fromDate, toDate } = req.query

    const popularity = await medicalService.getServicePopularity({
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    })

    return res.status(200).json({ popularity })
  } catch (error: any) {
    console.error('Error getting service popularity:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Advanced Controllers
export async function getMedicalRoomScheduleController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { date, fromDate, toDate } = req.query

    let startDate, endDate

    if (date) {
      startDate = new Date(date as string)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(date as string)
      endDate.setHours(23, 59, 59, 999)
    } else {
      if (fromDate) startDate = new Date(fromDate as string)
      if (toDate) endDate = new Date(toDate as string)
    }

    const timeSlots = await medicalService.getTimeSlots({
      filter: { roomId: id, fromTime: startDate, toTime: endDate },
      page: 1,
      limit: 1000
    })

    // Group slots by date
    const schedule: {
      [date: number]: {
        dateString: string
        slots: any[]
      }
    } = {}
    timeSlots.data.forEach((slot: any) => {
      const dateKey = new Date(slot.fromTime).getTime()
      if (!schedule[dateKey]) {
        schedule[dateKey] = {
          dateString: new Date(slot.fromTime).toISOString().split('T')[0],
          slots: []
        }
      }
      schedule[dateKey].slots.push(slot)
    })

    return res.status(200).json({
      roomId: id,
      schedule,
      totalSlots: timeSlots.data.length
    })
  } catch (error: any) {
    console.error('Error getting room schedule:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getDepartmentScheduleController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.params
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    const selectedDate = new Date(date as string)
    const timeSlots = await medicalService.getTimeSlots({
      filter: {
        departmentId,
        date: selectedDate
      },
      page: 1,
      limit: 1000
    })

    // Group by room
    const roomSchedule: { [roomId: string]: any } = {}
    timeSlots.data.forEach((slot: any) => {
      const roomId = slot.roomId
      if (!roomSchedule[roomId]) {
        roomSchedule[roomId] = {
          room: slot.room,
          slots: []
        }
      }
      roomSchedule[roomId].slots.push(slot)
    })

    return res.status(200).json({
      departmentId,
      date: selectedDate,
      roomSchedule,
      totalRooms: Object.keys(roomSchedule).length,
      totalSlots: timeSlots.data.length
    })
  } catch (error: any) {
    console.error('Error getting department schedule:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function checkTimeSlotAvailabilityController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { roomId, fromTime, toTime } = req.body

    if (!roomId || !fromTime || !toTime) {
      return res.status(400).json({ error: 'Room ID, from time, and to time are required' })
    }

    // Check for overlapping slots
    const overlappingSlots = await medicalService.getTimeSlots({
      filter: {
        roomId,
        fromTime: new Date(fromTime),
        toTime: new Date(toTime)
      },
      page: 1,
      limit: 1
    })

    const isAvailable = overlappingSlots.data.length === 0

    return res.status(200).json({
      available: isAvailable,
      conflicts: isAvailable ? [] : overlappingSlots.data,
      message: isAvailable ? 'Time slot is available' : 'Time slot conflicts with existing slots'
    })
  } catch (error: any) {
    console.error('Error checking time slot availability:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function bulkDeleteTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { timeSlotIds } = req.body

    if (!Array.isArray(timeSlotIds) || timeSlotIds.length === 0) {
      return res.status(400).json({ error: 'Time slot IDs array is required and cannot be empty' })
    }

    let deletedCount = 0
    const errors: string[] = []

    for (const slotId of timeSlotIds) {
      try {
        await medicalService.deleteTimeSlot(slotId)
        deletedCount++
      } catch (error: any) {
        errors.push(`Failed to delete time slot ${slotId}: ${error.message}`)
      }
    }

    return res.status(200).json({
      message: `Bulk delete completed. ${deletedCount} time slots deleted.`,
      deletedCount,
      totalRequested: timeSlotIds.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error in bulk delete time slots:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getMedicalRoomTypesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 1000 } = req.query
    const services = await medicalService.getServices({
      page: Number(page),
      limit: Number(limit)
    })

    const roomTypes = services.data.map((service: any) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      roomCount: service._count?.medicalRooms || 0
    }))

    return res.status(200).json({
      roomTypes,
      total: roomTypes.length
    })
  } catch (error: any) {
    console.error('Error getting room types:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getMedicalRoomsByFloorController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, floor } = req.params

    if (!departmentId || floor === undefined) {
      return res.status(400).json({ error: 'Department ID and floor are required' })
    }

    const rooms = await medicalService.getMedicalRooms({
      filter: {
        departmentId,
        floor: parseInt(floor)
      },
      page: 1,
      limit: 100
    })

    return res.status(200).json({
      departmentId,
      floor: parseInt(floor),
      rooms: rooms.data,
      total: rooms.data.length
    })
  } catch (error: any) {
    console.error('Error getting rooms by floor:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateTimeSlotController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { roomId, fromTime, toTime } = req.body

    console.log(id)

    const existingSlot = await medicalService.getTimeSlots({
      filter: { id },
      page: 1,
      limit: 1
    })

    if (existingSlot.data.length === 0) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    const slot = existingSlot.data[0]

    // Check if slot is booked
    if (slot.bookings && slot.bookings.length > 0) {
      return res.status(400).json({ error: 'Cannot update booked time slot' })
    }

    const newSlot = await medicalService.updateTimeSlot(id, {
      roomId: roomId || undefined,
      fromTime: fromTime ? new Date(fromTime) : undefined,
      toTime: toTime ? new Date(toTime) : undefined
    })

    return res.status(200).json({
      message: 'Time slot updated successfully',
      timeSlot: newSlot
    })
  } catch (error: any) {
    console.error('Error updating time slot:', error)
    return res.status(400).json({ error: error.message || 'Failed to update time slot' })
  }
}
