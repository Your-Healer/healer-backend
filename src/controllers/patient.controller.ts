import { Request, Response, NextFunction } from 'express'
import PatientService from '~/services/patient.service'

const patientService = PatientService.getInstance()

export async function createPatientController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const {
      userId,
      firstname,
      lastname,
      phoneNumber,
      address,
      emergencyContact,
      medicalHistory,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      insurance
    } = req.body

    if (!userId || !firstname || !lastname) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const patient = await patientService.createPatient({
      userId,
      firstname,
      lastname,
      phoneNumber,
      address,
      emergencyContact,
      medicalHistory,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      bloodType,
      allergies,
      insurance
    })

    return res.status(201).json({
      message: 'Patient created successfully',
      patient
    })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updatePatientController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const {
      firstname,
      lastname,
      phoneNumber,
      address,
      emergencyContact,
      medicalHistory,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      insurance
    } = req.body

    const patient = await patientService.updatePatient(id, {
      firstname,
      lastname,
      phoneNumber,
      address,
      emergencyContact,
      medicalHistory,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      bloodType,
      allergies,
      insurance
    })

    return res.status(200).json({
      message: 'Patient updated successfully',
      patient
    })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const patient = await patientService.getPatientById(id)

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    return res.status(200).json(patient)
  } catch (error: any) {
    console.error('Error fetching patient:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId, searchTerm, hasAppointments, minAge, maxAge, gender, bloodType, page = 1, limit = 10 } = req.query

    const filter = {
      userId: userId as string,
      searchTerm: searchTerm as string,
      hasAppointments: hasAppointments === 'true' ? true : hasAppointments === 'false' ? false : undefined,
      ageRange:
        minAge || maxAge
          ? {
              min: minAge ? parseInt(minAge as string) : 0,
              max: maxAge ? parseInt(maxAge as string) : 150
            }
          : undefined,
      gender: gender as string,
      bloodType: bloodType as string
    }

    const result = await patientService.getPatients(filter, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patients:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientsByUserIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await patientService.getPatientsByUserId(userId, parseInt(page as string), parseInt(limit as string))

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patients by user ID:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function searchPatientsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { searchTerm } = req.query
    const { page = 1, limit = 10 } = req.query

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' })
    }

    const result = await patientService.searchPatients(
      searchTerm as string,
      parseInt(page as string),
      parseInt(limit as string)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error searching patients:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientAppointmentHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await patientService.getPatientAppointmentHistory(
      id,
      parseInt(page as string),
      parseInt(limit as string)
    )

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patient appointment history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const stats = await patientService.getPatientStatistics(id)

    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching patient statistics:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientMedicalHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { id } = req.params
    const history = await patientService.getPatientMedicalHistory(id)

    return res.status(200).json(history)
  } catch (error: any) {
    console.error('Error fetching patient medical history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deletePatientController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await patientService.deletePatient(id)

    return res.status(200).json({
      message: 'Patient deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting patient:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
