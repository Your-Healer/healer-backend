import { Request, Response, NextFunction } from 'express'
import AppointmentService from '~/services/appointment.service'
import { APPOINTMENTSTATUS } from '@prisma/client'

const appointmentService = AppointmentService.getInstance()

export async function createAppointmentController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const { patientId, medicalRoomTimeId, notes } = req.body

    if (!patientId || !medicalRoomTimeId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const appointment = await appointmentService.createAppointment({
      userId,
      patientId,
      medicalRoomTimeId,
      notes
    })

    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updateAppointmentStatusController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params
    const { status } = req.body

    if (!Object.values(APPOINTMENTSTATUS).includes(status as APPOINTMENTSTATUS)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const appointment = await appointmentService.updateAppointmentStatus(appointmentId, status as APPOINTMENTSTATUS)

    return res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment
    })
  } catch (error: any) {
    console.error('Error updating appointment status:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function cancelAppointmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params

    const appointment = await appointmentService.cancelAppointment(appointmentId)

    return res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment
    })
  } catch (error: any) {
    console.error('Error cancelling appointment:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function completeAppointmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params

    const appointment = await appointmentService.completeAppointment(appointmentId)

    return res.status(200).json({
      message: 'Appointment completed successfully',
      appointment
    })
  } catch (error: any) {
    console.error('Error completing appointment:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAppointmentByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params
    const appointment = await appointmentService.getAppointmentById(appointmentId)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    return res.status(200).json(appointment)
  } catch (error: any) {
    console.error('Error fetching appointment:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAppointmentsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const {
      userId,
      staffId,
      departmentId,
      status,
      date,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      orderByFromTime,
      orderByToTime
    } = req.query

    const filter: any = {
      userId: userId as string,
      staffId: staffId as string,
      departmentId: departmentId as string,
      status: status as APPOINTMENTSTATUS,
      date: date ? new Date(date as string) : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    }

    if (typeof orderByFromTime === 'string' && orderByFromTime !== 'asc' && orderByFromTime !== 'desc') {
      return res.status(400).json({ error: 'Invalid orderByFromTime value' })
    }
    if (typeof orderByToTime === 'string' && orderByToTime !== 'asc' && orderByToTime !== 'desc') {
      return res.status(400).json({ error: 'Invalid orderByToTime value' })
    }

    const result = await appointmentService.getAppointments(
      filter,
      parseInt(page as string),
      parseInt(limit as string),
      orderByFromTime as 'asc' | 'desc' | undefined,
      orderByToTime as 'asc' | 'desc' | undefined
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching appointments:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getUpcomingAppointmentsController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.user
    const { page = 1, limit = 10 } = req.query

    console.log(limit)

    const appointments = await appointmentService.getUpcomingAppointments(
      userId,
      parseInt(page as string),
      parseInt(limit as string)
    )

    return res.status(200).json(appointments)
  } catch (error: any) {
    console.error('Error fetching upcoming appointments:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function addDiagnosisSuggestionController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params
    const { suggestedByAI, disease, confidence, description } = req.body

    if (!disease || confidence === undefined) {
      return res.status(400).json({ error: 'Disease and confidence are required' })
    }

    const suggestion = await appointmentService.addDiagnosisSuggestion({
      appointmentId,
      suggestedByAI: Boolean(suggestedByAI),
      disease,
      confidence: parseFloat(confidence),
      description
    })

    return res.status(201).json({
      message: 'Diagnosis suggestion added successfully',
      suggestion
    })
  } catch (error: any) {
    console.error('Error adding diagnosis suggestion:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAppointmentStatisticsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { departmentId, fromDate, toDate } = req.query

    const filter = {
      departmentId: departmentId as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined
    }

    const stats = await appointmentService.getAppointmentStatistics(filter)

    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching appointment statistics:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function checkTimeSlotAvailabilityController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { medicalRoomTimeId } = req.params

    const isAvailable = await appointmentService.checkTimeSlotAvailability(medicalRoomTimeId)

    return res.status(200).json({ available: isAvailable })
  } catch (error: any) {
    console.error('Error checking time slot availability:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getAppointmentsByStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId } = req.params
    const { date, page = 1, limit = 10 } = req.query

    const result = await appointmentService.getAppointmentsByStaff(
      staffId,
      date ? new Date(date as string) : undefined,
      parseInt(page as string),
      parseInt(limit as string)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching appointments by staff:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientAppointmentHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { patientId } = req.params
    const { page = 1, limit = 10, status } = req.query

    const result = await appointmentService.getPatientAppointmentHistory({
      patientId,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as APPOINTMENTSTATUS | undefined
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patient appointment history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
