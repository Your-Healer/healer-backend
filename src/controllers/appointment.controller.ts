import { Request, Response, NextFunction } from 'express'
import AppointmentService from '~/services/appointment.service'
import { APPOINTMENTSTATUS } from '~/generated/prisma/client'

const appointmentService = AppointmentService.getInstance()

export async function createAppointmentController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id: userId, accountId } = req.user
    const { medicalRoomId, medicalRoomTimeId } = req.body

    const appointment = await appointmentService.createAppointment({
      userId,
      medicalRoomId,
      medicalRoomTimeId,
      patientId: accountId
    })

    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateAppointmentStatusController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate the status input
    if (!Object.values(APPOINTMENTSTATUS).includes(status as APPOINTMENTSTATUS)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const updatedAppointment = await appointmentService.updateAppointmentStatus(id, status as APPOINTMENTSTATUS)

    return res.status(200).json({
      message: 'Appointment status updated successfully',
      appointment: updatedAppointment
    })
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAppointmentByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const appointment = await appointmentService.getAppointmentById(id)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    return res.status(200).json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function addDiagnosisController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { appointmentId } = req.params
    const { diseaseId, confidence, suggestedByAI } = req.body

    const diagnosis = await appointmentService.addDiagnosisSuggestion({
      appointmentId,
      diseaseId,
      confidence,
      suggestedByAI: Boolean(suggestedByAI)
    })

    return res.status(201).json({
      message: 'Diagnosis added successfully',
      diagnosis
    })
  } catch (error) {
    console.error('Error adding diagnosis:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAvailableTimeSlotsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { medicalRoomId } = req.params
    const dateStr = req.query.date as string

    if (!dateStr) {
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    const date = new Date(dateStr)
    const availableSlots = await appointmentService.getAvailableTimeSlots(medicalRoomId, date)

    return res.status(200).json(availableSlots)
  } catch (error) {
    console.error('Error fetching available time slots:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
