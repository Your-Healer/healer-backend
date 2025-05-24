import { Request, Response, NextFunction } from 'express'
import ShiftService from '~/services/shift.service'

const shiftService = ShiftService.getInstance()

export async function createShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { doctorId, roomId, fromTime, toTime } = req.body

    // Validate input
    if (!doctorId || !roomId || !fromTime || !toTime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const shift = await shiftService.createShift({
      doctorId,
      roomId,
      fromTime: new Date(fromTime),
      toTime: new Date(toTime)
    })

    return res.status(201).json({
      message: 'Shift created successfully',
      shift
    })
  } catch (error) {
    console.error('Error creating shift:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { doctorId, roomId, fromTime, toTime } = req.body

    const updateData: any = {}

    if (doctorId) updateData.doctorId = doctorId
    if (roomId) updateData.roomId = roomId
    if (fromTime) updateData.fromTime = new Date(fromTime)
    if (toTime) updateData.toTime = new Date(toTime)

    const shift = await shiftService.updateShift(id, updateData)

    return res.status(200).json({
      message: 'Shift updated successfully',
      shift
    })
  } catch (error) {
    console.error('Error updating shift:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteShiftController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    await shiftService.deleteShift(id)

    return res.status(200).json({
      message: 'Shift deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsForRoomController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roomId } = req.params
    const { from, to } = req.query

    let fromDate = from ? new Date(from as string) : undefined
    let toDate = to ? new Date(to as string) : undefined

    const shifts = await shiftService.getShiftsByRoomId(roomId, fromDate, toDate)

    return res.status(200).json(shifts)
  } catch (error) {
    console.error('Error fetching shifts for room:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getShiftsForDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.params
    const { from, to } = req.query

    let fromDate = from ? new Date(from as string) : undefined
    let toDate = to ? new Date(to as string) : undefined

    const shifts = await shiftService.getShiftsByDepartment(departmentId, fromDate, toDate)

    return res.status(200).json(shifts)
  } catch (error) {
    console.error('Error fetching shifts for department:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
