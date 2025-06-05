import { NextFunction, Request, Response } from 'express'
import ShiftWorkingService from '~/services/shiftWorking.service'

const shiftService = ShiftWorkingService.getInstance()

export async function createShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, roomId, fromTime, toTime } = req.body

    const shift = await shiftService.createShift({
      staffId,
      roomId,
      fromTime: new Date(fromTime),
      toTime: new Date(toTime)
    })

    return res.status(201).json({
      message: 'Shift created successfully',
      shift
    })
  } catch (error: any) {
    console.error('Error creating shift:', error)
    return res.status(400).json({ error: error.message || 'Failed to create shift' })
  }
}

export async function updateShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { staffId, roomId, fromTime, toTime } = req.body

    const updateData: any = {}
    if (staffId) updateData.staffId = staffId
    if (roomId) updateData.roomId = roomId
    if (fromTime) updateData.fromTime = new Date(fromTime)
    if (toTime) updateData.toTime = new Date(toTime)

    const shift = await shiftService.updateShift(id, updateData)

    return res.status(200).json({
      message: 'Shift updated successfully',
      shift
    })
  } catch (error: any) {
    console.error('Error updating shift:', error)
    return res.status(400).json({ error: error.message || 'Failed to update shift' })
  }
}

export async function deleteShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await shiftService.deleteShift(id)

    return res.status(200).json({
      message: 'Shift deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting shift:', error)
    return res.status(400).json({ error: error.message || 'Failed to delete shift' })
  }
}

export async function getShiftByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    const shift = await shiftService.getShiftById(id)
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' })
    }

    return res.status(200).json({ shift })
  } catch (error: any) {
    console.error('Error getting shift:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10, staffId, roomId, departmentId, date, fromDate, toDate } = req.query

    const filter: any = {}
    if (staffId) filter.staffId = staffId as string
    if (roomId) filter.roomId = roomId as string
    if (departmentId) filter.departmentId = departmentId as string
    if (date) filter.date = new Date(date as string)
    if (fromDate) filter.fromDate = new Date(fromDate as string)
    if (toDate) filter.toDate = new Date(toDate as string)

    const result = await shiftService.getShifts(filter, Number(page), Number(limit))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting shifts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsByDoctorController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId } = req.params
    const { page = 1, limit = 10, fromDate, toDate } = req.query

    const result = await shiftService.getShiftsByDoctor(
      staffId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      Number(page),
      Number(limit)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting shifts by doctor:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsByRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId } = req.params
    const { page = 1, limit = 10, fromDate, toDate } = req.query

    const result = await shiftService.getShiftsByRoom(
      roomId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      Number(page),
      Number(limit)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting shifts by room:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsByDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.params
    const { page = 1, limit = 10, fromDate, toDate } = req.query

    const result = await shiftService.getShiftsByDepartment(
      departmentId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      Number(page),
      Number(limit)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting shifts by department:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function createBulkShiftsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, roomId, dates, morningShift, afternoonShift } = req.body

    const shifts = await shiftService.createBulkShifts({
      staffId,
      roomId,
      dates: dates.map((date: string) => new Date(date)),
      morningShift,
      afternoonShift
    })

    return res.status(201).json({
      message: `${shifts.length} shifts created successfully`,
      shifts,
      totalRequested: dates.length * ((morningShift ? 1 : 0) + (afternoonShift ? 1 : 0)),
      totalCreated: shifts.length
    })
  } catch (error: any) {
    console.error('Error creating bulk shifts:', error)
    return res.status(400).json({ error: error.message || 'Failed to create bulk shifts' })
  }
}

export async function createRecurringShiftsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, roomId, startDate, endDate, daysOfWeek, timeSlots } = req.body

    const shifts = await shiftService.createRecurringShifts({
      staffId,
      roomId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      daysOfWeek,
      timeSlots
    })

    return res.status(201).json({
      message: `${shifts.length} recurring shifts created successfully`,
      shifts,
      totalCreated: shifts.length
    })
  } catch (error: any) {
    console.error('Error creating recurring shifts:', error)
    return res.status(400).json({ error: error.message || 'Failed to create recurring shifts' })
  }
}

export async function getShiftStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, departmentId, fromDate, toDate } = req.query

    const filter: any = {}
    if (staffId) filter.staffId = staffId as string
    if (departmentId) filter.departmentId = departmentId as string
    if (fromDate) filter.fromDate = new Date(fromDate as string)
    if (toDate) filter.toDate = new Date(toDate as string)

    const statistics = await shiftService.getShiftStatistics(filter)

    return res.status(200).json({ statistics })
  } catch (error: any) {
    console.error('Error getting shift statistics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function checkShiftConflictsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, fromTime, toTime, excludeShiftId } = req.body

    const conflicts = await shiftService.checkShiftConflicts(
      staffId,
      new Date(fromTime),
      new Date(toTime),
      excludeShiftId
    )

    return res.status(200).json({
      hasConflicts: conflicts.length > 0,
      conflicts
    })
  } catch (error: any) {
    console.error('Error checking shift conflicts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function assignShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId, staffId, fromDate, toDate } = req.body
    const shift = await shiftService.assignShift(roomId, staffId, new Date(fromDate), new Date(toDate))
    return res.status(200).json({
      message: 'Shift assigned successfully',
      shift
    })
  } catch (error: any) {
    console.error('Error assigning shift:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsByDateRangeController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { fromDate, toDate } = req.body
    const shifts = await shiftService.getShiftsByDateRange(new Date(fromDate as string), new Date(toDate as string))

    return res.status(200).json({
      ...shifts
    })
  } catch (error: any) {
    console.error('Error getting shifts by date range:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsByStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId } = req.params
    const { page = 1, limit = 10, fromDate, toDate } = req.query
    const result = await shiftService.getShiftsByStaff(
      staffId,
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined,
      Number(page),
      Number(limit)
    )
    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error getting shifts by staff:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
