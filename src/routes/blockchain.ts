import { Router } from 'express'
import {
  createNewPatientController,
  getAllExtrinsicTransactionsController,
  getAllQueriesController,
  setBalancesController,
  getPatientByIdController,
  updatePatientController,
  deletePatientController,
  getPatientIdsByPatientNameController,
  getClinicalTestsController,
  createClinicalTestController,
  updateClinicalTestController,
  deleteClinicalTestController,
  createDiseaseProgressionController,
  updateDiseaseProgressionController,
  deleteDiseaseProgressionController,
  createMedicalRecordController,
  getDiseaseProgressionsController,
  getAllHistoryChangesController,
  getAllPatientsController,
  getAllPatientClinicalTestsController,
  getAllPatientDiseaseProgressionsController,
  getNextPatientIdController,
  getNextTestIdController,
  getNextProgressionIdController,
  getNextRecordIdController,
  getMedicalRecordsController,
  getPatientDiseaseProgressionsController,
  getPatientClinicalTestsController,
  getPatientMedicalRecordsController,
  getAllPatientMedicalRecordsController,
  getNextChangeIdController
} from '~/controllers/blockchain.controller'
import { protect } from '../middlewares/auth/index'

const router = Router()

// Common
router.post('/set-balances', setBalancesController)

router.get('/get-all-queries', getAllQueriesController)

router.get('/get-all-extrinsics', getAllExtrinsicTransactionsController)

// Patient

router.get('/next-patient-id', protect, getNextPatientIdController)

router.get('/patients/:id', protect, getPatientByIdController)

router.get('/patients/name', protect, getPatientIdsByPatientNameController)

router.get('/patients/', protect, getAllPatientsController)

router.post('/patients/', protect, createNewPatientController)

router.patch('/patients/', protect, updatePatientController)

router.delete('/patients/:patientId', protect, deletePatientController)

// Clinical Tests

router.get('/next-test-id', protect, getNextTestIdController)

router.get('/clinical-tests/all', protect, getAllPatientClinicalTestsController)

router.get('/clinical-tests/:id', protect, getClinicalTestsController)

router.get('/clinical-tests/patients/:patientId', protect, getPatientClinicalTestsController)

router.post('/clinical-tests/', protect, createClinicalTestController)

router.patch('/clinical-tests/', protect, updateClinicalTestController)

router.delete('/clinical-tests/:testId', protect, deleteClinicalTestController)

// Disease Progressions

router.get('/next-progression-id', protect, getNextProgressionIdController)

router.get('/disease-progressions/all', protect, getAllPatientDiseaseProgressionsController)

router.get('/disease-progressions/:id', protect, getDiseaseProgressionsController)

router.get('/disease-progressions/patients/:patientId', protect, getPatientDiseaseProgressionsController)

router.post('/disease-progressions/', protect, createDiseaseProgressionController)

router.patch('/disease-progressions/', protect, updateDiseaseProgressionController)

router.delete('/disease-progressions/:progressionId', protect, deleteDiseaseProgressionController)

// Medical Records

router.get('/next-record-id', protect, getNextRecordIdController)

router.get('/medical-records/:id', protect, getMedicalRecordsController)

router.get('/medical-records/patients/:patientId', protect, getPatientMedicalRecordsController)

router.get('/medical-records/all', protect, getAllPatientMedicalRecordsController)

router.post('/medical-records/', protect, createMedicalRecordController)

// Changes

router.get('/next-change-id', protect, getNextChangeIdController)

router.get('/changes', protect, getAllHistoryChangesController)

export default router
