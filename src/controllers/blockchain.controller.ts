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

export async function getClinicalTestsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { patientId } = req.query
    if (!patientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient ID is required',
        timestamp: new Date().toISOString()
      })
    }
    const clinicalTests = await blockchainService.getClinicalTests(Number(patientId))
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
