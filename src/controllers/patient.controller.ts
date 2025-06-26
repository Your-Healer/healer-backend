import { Request, Response, NextFunction } from 'express'
import PatientService from '~/services/patient.service'

const patientService = PatientService.getInstance()

export async function createPatientController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId, firstname, lastname, phoneNumber, address } = req.body

    if (!userId || !firstname || !lastname) {
      return res.status(400).json({ error: 'UserId, firstname, and lastname are required' })
    }

    const patient = await patientService.createPatient({
      userId,
      firstname,
      lastname,
      phoneNumber,
      address
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
    const { page = 1, limit = 10, userId, searchTerm, hasAppointments, gender, bloodType, minAge, maxAge } = req.query

    const filter: any = {
      userId: userId as string,
      searchTerm: searchTerm as string,
      hasAppointments: hasAppointments ? hasAppointments === 'true' : undefined,
      gender: gender as string,
      bloodType: bloodType as string
    }

    if (minAge || maxAge) {
      filter.ageRange = {
        min: minAge ? parseInt(minAge as string) : undefined,
        max: maxAge ? parseInt(maxAge as string) : undefined
      }
    }

    const result = await patientService.getPatients({
      filter,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

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

    const result = await patientService.getPatientsByUserId({
      userId,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patients by user ID:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function searchPatientsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { searchTerm, page = 1, limit = 10 } = req.query

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' })
    }

    const result = await patientService.searchPatients({
      searchTerm: searchTerm as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

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
    const { id: patientId } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await patientService.getPatientAppointmentHistory({
      patientId,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching patient appointment history:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id: patientId } = req.params

    const statistics = await patientService.getPatientStatistics(patientId)

    if (!statistics) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    return res.status(200).json(statistics)
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
    const { id: patientId } = req.params

    const medicalHistory = await patientService.getPatientMedicalHistory(patientId)

    return res.status(200).json(medicalHistory)
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

export async function getCurrentPatientController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = (req as any)?.user

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await patientService.getPatientsByUserId({
      userId,
      page: 1,
      limit: 10000
    })

    if (result.data.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' })
    }

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching current patient:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getPatientProfileController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { userId } = (req as any)?.user

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await patientService.getPatientsByUserId({
      userId,
      page: 1,
      limit: 1
    })

    if (result.data.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' })
    }

    const patient = result.data[0]
    const statistics = await patientService.getPatientStatistics(patient.id)

    return res.status(200).json({
      ...patient,
      statistics
    })
  } catch (error: any) {
    console.error('Error fetching patient profile:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
