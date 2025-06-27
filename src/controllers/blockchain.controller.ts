import { NextFunction, Response, Request } from 'express'
import BlockchainService from '~/services/blockchain.service'
import { BlockchainCreatePatientDto } from '~/utils/types'

const blockchainService = BlockchainService.getInstance()

export async function getAllExtrinsicTransactionsController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const extrinsics = await blockchainService.getExtrinsic()
    return res.status(200).json({
      status: 'success',
      data: extrinsics,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching extrinsics:', error)
    return {
      status: 'error',
      message: 'Failed to fetch extrinsics',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

export async function getSudoKeyController() {
  return await blockchainService.testSudo()
}

export async function setBalancesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { addresses, amount } = req.body
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      console.log(`Setting balance for address: ${address} to amount: ${amount}`)
      await new Promise((resolve) => setTimeout(resolve, 10000))
      await blockchainService.forceSetBalance(address, BigInt(amount))
    }
    return res.status(200).json({
      status: 'success',
      message: 'Balances set successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error setting balances:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to set balances',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getAllQueriesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const queries = await blockchainService.getQueries()
    return res.status(200).json({
      status: 'success',
      data: queries,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching queries:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch queries',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getPatientByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const patient = await blockchainService.getPatientById(Number(id))
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found',
        timestamp: new Date().toISOString()
      })
    }
    return res.status(200).json({
      status: 'success',
      data: patient,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getPatientIdsByPatientNameController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { patientName } = req.query
    if (!patientName) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient name is required',
        timestamp: new Date().toISOString()
      })
    }
    const patientIds = await blockchainService.getPatientIdsByPatientName(patientName as string)
    return res.status(200).json({
      status: 'success',
      data: patientIds,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching patient IDs:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient IDs',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getDiseaseProgressionsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Progression ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const diseaseProgressions = await blockchainService.getDiseaseProgressions(Number(id))
    return res.status(200).json({
      status: 'success',
      data: diseaseProgressions,
      timestamp: new Date().toISOString()
    })
  } catch {}
}

export async function getAllDiseaseProgressionsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const diseaseProgressions = await blockchainService.getAllPatientDiseaseProgressions()
    return res.status(200).json({
      status: 'success',
      data: diseaseProgressions,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching all disease progressions:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch all disease progressions',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getAllPatientsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const patients = await blockchainService.getAllPatients()
    return res.status(200).json({
      status: 'success',
      data: patients,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching all patients:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch all patients',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getAllHistoryChangesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const historyChanges = await blockchainService.getAllHistoryChanges()
    return res.status(200).json({
      status: 'success',
      data: historyChanges,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching history changes:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history changes',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getAllPatientClinicalTestsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const clinicalTests = await blockchainService.getAllPatientClinicalTests()
    return res.status(200).json({
      status: 'success',
      data: clinicalTests,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching all patient clinical tests:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch all patient clinical tests',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getClinicalTestsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const clinicalTests = await blockchainService.getClinicalTests(Number(id))
    return res.status(200).json({
      status: 'success',
      data: clinicalTests,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching clinical tests:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch clinical tests',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getNextPatientIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const nextId = await blockchainService.getNextPatientId()
    return res.status(200).json({
      status: 'success',
      data: nextId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching next patient ID:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch next patient ID',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getNextTestIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const nextId = await blockchainService.getNextTestId()
    return res.status(200).json({
      status: 'success',
      data: nextId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching next test ID:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch next test ID',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getNextProgressionIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const nextId = await blockchainService.getNextProgressionId()
    return res.status(200).json({
      status: 'success',
      data: nextId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching next progression ID:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch next progression ID',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function getNextRecordIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const nextId = await blockchainService.getNextRecordId()
    return res.status(200).json({
      status: 'success',
      data: nextId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching next medical record ID:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch next medical record ID',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function createNewPatientController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const patientData = req.body
    const { accountId } = req.user
    if (!patientData || !accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        timestamp: new Date().toISOString()
      })
    }
    const newPatient = await blockchainService.createNewPatient({
      accountId,
      ...patientData
    })
    return res.status(201).json({
      status: 'success',
      data: newPatient,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating new patient:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create new patient',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function updatePatientController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const patientData = req.body
    const updatedPatient = await blockchainService.updatePatient(accountId, patientData)
    if (!updatedPatient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found',
        timestamp: new Date().toISOString()
      })
    }
    return res.status(200).json({
      status: 'success',
      data: updatedPatient,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error updating patient:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update patient',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function deletePatientController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const { patientId } = req.params
    const deleted = await blockchainService.deletePatient(accountId, { patientId: Number(patientId) })
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found',
        timestamp: new Date().toISOString()
      })
    }
    return res.status(200).json({
      status: 'success',
      message: 'Patient deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error deleting patient:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete patient',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function createClinicalTestController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const clinicalTestData = req.body
    const newClinicalTest = await blockchainService.createClinicalTest(accountId, clinicalTestData)
    return res.status(201).json({
      status: 'success',
      data: newClinicalTest,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating clinical test:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create clinical test',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function updateClinicalTestController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const clinicalTestData = req.body
    const updatedClinicalTest = await blockchainService.updateClinicalTest(accountId, clinicalTestData)
    return res.status(200).json({
      status: 'success',
      data: updatedClinicalTest,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error updating clinical test:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update clinical test',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function deleteClinicalTestController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const { testId } = req.params
    const deleted = await blockchainService.deleteClinicalTest(accountId, { testId: Number(testId) })
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Clinical test not found',
        timestamp: new Date().toISOString()
      })
    }
    return res.status(200).json({
      status: 'success',
      message: 'Clinical test deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error deleting clinical test:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete clinical test',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function createDiseaseProgressionController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const diseaseProgressionData = req.body
    const newDiseaseProgression = await blockchainService.createDiseaseProgression(accountId, diseaseProgressionData)
    return res.status(201).json({
      status: 'success',
      data: newDiseaseProgression,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating disease progression:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create disease progression',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function updateDiseaseProgressionController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const diseaseProgressionData = req.body
    const updatedDiseaseProgression = await blockchainService.updateDiseaseProgression(
      accountId,
      diseaseProgressionData
    )
    return res.status(200).json({
      status: 'success',
      data: updatedDiseaseProgression,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error updating disease progression:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update disease progression',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function deleteDiseaseProgressionController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const { progressionId } = req.params
    const deleted = await blockchainService.deleteDiseaseProgression(accountId, {
      progressionId: Number(progressionId)
    })
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Disease progression not found',
        timestamp: new Date().toISOString()
      })
    }
    return res.status(200).json({
      status: 'success',
      message: 'Disease progression deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error deleting disease progression:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete disease progression',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

export async function createMedicalRecordController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = req.user
    if (!accountId) {
      return res.status(400).json({
        status: 'error',
        message: 'Account ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const medicalRecordData = req.body
    const newMedicalRecord = await blockchainService.createMedicalRecord(accountId, medicalRecordData)
    return res.status(201).json({
      status: 'success',
      data: newMedicalRecord,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating medical record:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create medical record',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
