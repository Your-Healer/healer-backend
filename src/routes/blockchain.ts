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
  getAllDiseaseProgressionsController,
  getNextPatientIdController,
  getNextTestIdController,
  getNextProgressionIdController,
  getNextRecordIdController
} from '~/controllers/blockchain.controller'
import { protect } from '../middlewares/auth/index'

const router = Router()

router.post('/set-balances', setBalancesController)

router.get('/get-all-queries', getAllQueriesController)

router.get('/get-all-extrinsics', getAllExtrinsicTransactionsController)

router.get('/patients/:id', protect, getPatientByIdController)

router.get('/patients/name', protect, getPatientIdsByPatientNameController)

router.get('/patients/', protect, getAllPatientsController)

router.get('/clinical-tests/all', protect, getAllPatientClinicalTestsController)

router.get('/clinical-tests/:id', protect, getClinicalTestsController)

router.get('/disease-progressions/all', protect, getAllDiseaseProgressionsController)

router.get('/disease-progressions/:id', protect, getDiseaseProgressionsController)

// router.get('/disease-progressions/:patientId', protect, getDiseaseProgressionsController)

router.get('/changes', protect, getAllHistoryChangesController)

router.get('/next-patient-id', protect, getNextPatientIdController)

router.get('/next-test-id', protect, getNextTestIdController)

router.get('/next-progression-id', protect, getNextProgressionIdController)

router.get('/next-record-id', protect, getNextRecordIdController)

router.post('/patients/', protect, createNewPatientController)

router.patch('/patients/', protect, updatePatientController)

router.delete('/patients/:patientId', protect, deletePatientController)

router.post('/clinical-tests/', protect, createClinicalTestController)

router.patch('/clinical-tests/', protect, updateClinicalTestController)

router.delete('/clinical-tests/:testId', protect, deleteClinicalTestController)

router.post('/disease-progressions/', protect, createDiseaseProgressionController)

router.patch('/disease-progressions/', protect, updateDiseaseProgressionController)

router.delete('/disease-progressions/:progressionId', protect, deleteDiseaseProgressionController)

router.post('/medical-records/', protect, createMedicalRecordController)

export default router
