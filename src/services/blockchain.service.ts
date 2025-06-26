import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { cryptoWaitReady, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto'
import configs from '../configs/env/index'
import {
  AllExtrinsics,
  BlockchainCreateClinicalTestDto,
  BlockchainCreateDiseaseProgressionDto,
  BlockchainCreateMedicalRecordDto,
  BlockchainCreatePatientDto,
  BlockchainDeleteClinicalTestDto,
  BlockchainDeleteDiseaseProgressionDto,
  BlockchainDeletePatientDto,
  BlockchainUpdateClinicalTestDto,
  BlockchainUpdateDiseaseProgressionDto,
  BlockchainUpdatePatientDto
} from '~/utils/types'
import { SubmittableExtrinsicFunction } from '@polkadot/api/types'
import { dateToHex, decryptString, hexToDate, hexToString, stringToHex } from '~/utils/helpers'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'

const SUSTRATE_HOST = configs.secrets.substrateHost || process.env.SUBSTRATE_HOST

export default class BlockchainService extends BaseService {
  private static instance: BlockchainService
  private provider: WsProvider
  private keyring: Keyring

  private constructor() {
    super()
    if (!SUSTRATE_HOST) {
      throw new Error('Substrate host is not configured.')
    }
    this.provider = new WsProvider(SUSTRATE_HOST)
    this.keyring = new Keyring({ type: 'sr25519' })
  }

  static getInstance() {
    if (!BlockchainService.instance) {
      BlockchainService.instance = new BlockchainService()
    }
    return BlockchainService.instance
  }

  async checkConnection() {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
      ])
      return { status: 'success', message: `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}` }
    } catch (error) {
      console.error('Error establishing connection:', error)
      return { status: 'error', message: 'Failed to connect to crypto library.' }
    }
  }

  async forceSetBalance(address: string, amount: bigint) {
    const api = await ApiPromise.create({ provider: this.provider })
    const keyring = new Keyring({ type: 'sr25519' })

    const alice = keyring.addFromUri('//Alice', { name: 'Alice' })

    const sudoExtrinsic = await api.tx.sudo
      .sudo(api.tx.balances.forceSetBalance(address, amount))
      .signAndSend(alice, async (result) => {
        console.log(`Current status is ${result.status}`)
        if (result.status.isInBlock) {
          console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
        } else if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
          sudoExtrinsic()
        }
      })
      .catch((error) => {
        console.error('Error in forceSetBalance:', error)
        throw new Error('Failed to set balance. Please check the address and amount.')
      })
  }

  async createNewWallet() {
    await cryptoWaitReady()
    const mnemonic = mnemonicGenerate(12)
    const isValidMnemonic = mnemonicValidate(mnemonic)

    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' })
    const pair = keyring.addFromMnemonic(mnemonic)

    return { mnemonic, isValidMnemonic, keyring, pair }
  }

  async getExtrinsic() {
    const api = await ApiPromise.create({ provider: this.provider })
    const extrinsic = api.tx

    const map: Partial<AllExtrinsics> = {}
    for (const [palletName, pallet] of Object.entries(extrinsic)) {
      const methods = Object.keys(pallet)
      if (methods.length > 0) {
        map[palletName] = {}
        for (const methodName of methods) {
          map[palletName]![methodName] = (pallet as any)[methodName] as SubmittableExtrinsicFunction<'promise'>
        }
      }
    }

    return map as AllExtrinsics
  }

  async getQueries() {
    const api = await ApiPromise.create({ provider: this.provider })
    const queries = api.query

    return queries
  }

  async testSudo() {
    try {
      return {
        status: 'success',
        message: 'Sudo command executed successfully.'
      }
    } catch (error) {
      console.error('Error in testSudo:', error)
      return { status: 'error', message: 'Failed to execute sudo command.' }
    }
  }

  async getPatientById(id: number) {
    const api = await ApiPromise.create({ provider: this.provider })
    const patient = (await api.query.medicalRecord.patients(id)).toHuman()

    console.log('Patient: ', patient)

    const parsedPatient = patient ? await this.parsePatientData(patient) : null

    return parsedPatient
  }

  async getPatientIdsByPatientName(name: string) {
    try {
      const nameHex = stringToHex(name)

      const api = await ApiPromise.create({ provider: this.provider })
      const patientIds = (await api.query.medicalRecord.patientNameToIds(nameHex)).toHuman()

      return (patientIds as string[]).map((id: any) => parseInt(id, 10))
    } catch (error) {
      this.handleError(error, 'getPatientIdsByPatientName')
    }
  }

  async getPatientsByPatientName(name: string) {
    try {
      const nameHex = stringToHex(name)

      const api = await ApiPromise.create({ provider: this.provider })
      const patientIds = (await api.query.medicalRecord.patientNameToIds(nameHex)).toHuman()

      return await Promise.all((patientIds as string[]).map(async (id: any) => this.getPatientById(parseInt(id, 10))))
    } catch (error) {
      this.handleError(error, 'getPatientsByPatientName')
    }
  }

  async getAllPatients() {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const nextId = (await api.query.medicalRecord.nextPatientId()).toHuman() as number

      const patients: any[] = []
      for (let i = 0; i < nextId; i++) {
        const patient = (await api.query.medicalRecord.patients(i)).toHuman() as any
        if (!patient) {
          continue
        }
        const parsedPatient = patient ? await this.parsePatientData(patient) : null
        patients.push(parsedPatient)
      }
      return patients
    } catch (error) {
      this.handleError(error, 'getAllHistoryChanges')
    }
  }

  async getAllPatientClinicalTests() {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const nextId = (await api.query.medicalRecord.nextPatientId()).toHuman() as number

      const tests: any[] = []
      for (let i = 0; i < nextId; i++) {
        const patient = (await api.query.medicalRecord.patients(i)).toHuman() as any
        if (!patient) {
          continue
        }
        const parsedPatient = patient ? await this.parsePatientData(patient) : null
        if (!parsedPatient) {
          continue
        }
        const test = (await api.query.medicalRecord.patientClinicalTests(i)).toHuman() as any
        tests.push({
          ...parsedPatient,
          test
        })
      }
      return tests
    } catch (error) {
      this.handleError(error, 'getAllPatientClinicalTests')
    }
  }

  async getClinicalTests(id: number) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const clinicalTests = (await api.query.medicalRecord.clinicalTests(id)).toHuman()

      console.log(clinicalTests)
      return clinicalTests
    } catch (error) {
      this.handleError(error, 'getClinicalTests')
    }
  }

  async getDiseaseProgressions(id: number) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const diseaseProgressions = (await api.query.medicalRecord.diseaseProgressions(id)).toHuman()

      console.log(diseaseProgressions)
      return diseaseProgressions
    } catch (error) {
      this.handleError(error, 'getDiseaseProgressions')
    }
  }

  async getAllPatientDiseaseProgressions() {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const nextId = (await api.query.medicalRecord.nextPatientId()).toHuman() as number

      const progressions: any[] = []
      for (let i = 0; i < nextId; i++) {
        const patient = (await api.query.medicalRecord.patients(i)).toHuman() as any
        if (!patient) {
          continue
        }
        const parsedPatient = patient ? await this.parsePatientData(patient) : null
        if (!parsedPatient) {
          continue
        }
        const progression = (await api.query.medicalRecord.patientDiseaseProgressions(i)).toHuman() as any
        progressions.push({
          ...parsedPatient,
          progression
        })
      }
      return progressions
    } catch (error) {
      this.handleError(error, 'getAllPatientClinicalTests')
    }
  }

  async getAllHistoryChanges() {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const nextId = (await api.query.medicalRecord.nextChangeId()).toHuman() as number

      const historyChanges: any[] = []
      for (let i = 0; i < nextId; i++) {
        const historyChange = (await api.query.medicalRecord.changeHistories(i)).toHuman() as any
        if (!historyChange) {
          continue
        }
        historyChange.oldValue = historyChange.oldValue ? hexToString(historyChange.oldValue as string) : null
        historyChange.newValue = historyChange.newValue ? hexToString(historyChange.newValue as string) : null
        historyChanges.push(historyChange)
      }
      return historyChanges
    } catch (error) {
      this.handleError(error, 'getAllHistoryChanges')
    }
  }

  async createNewPatient(data: BlockchainCreatePatientDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: data.accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .createPatient(
          stringToHex(data.patientName),
          stringToHex(data.dateOfBirth),
          stringToHex(data.gender),
          stringToHex(data.address || 'EMPTY'),
          stringToHex(data.phoneNumber || 'EMPTY'),
          stringToHex(data.emergencyContact || 'EMPTY')
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in createNewPatient:', error)
          throw new Error('Failed to create new patient. Please check the data and try again.')
        })

      return { status: 'success', message: 'Patient created successfully.' }
    } catch (error) {
      this.handleError(error, 'createNewPatient')
    }
  }

  async updatePatient(accountId: string, data: BlockchainUpdatePatientDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .updatePatient(
          data.patientId,
          data.patientName ? stringToHex(data.patientName) : null,
          data.dateOfBirth ? stringToHex(data.dateOfBirth) : null,
          data.gender ? stringToHex(data.gender) : null,
          data.address ? stringToHex(data.address) : null,
          data.phoneNumber ? stringToHex(data.phoneNumber) : null,
          data.emergencyContact ? stringToHex(data.emergencyContact) : null
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in updatePatient:', error)
          throw new Error('Failed to update patient. Please check the data and try again.')
        })

      return { status: 'success', message: 'Updated successfully.' }
    } catch (error) {
      this.handleError(error, 'updatePatient')
    }
  }

  async deletePatient(accountId: string, data: BlockchainDeletePatientDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .deletePatient(data.patientId)
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in deletePatient:', error)
          throw new Error('Failed to delete patient. Please check the data and try again.')
        })

      return { status: 'success', message: 'Updated successfully.' }
    } catch (error) {
      this.handleError(error, 'deletePatient')
    }
  }

  async createClinicalTest(accountId: string, data: BlockchainCreateClinicalTestDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .createClinicalTest(
          stringToHex(data.patientId.toString()),
          stringToHex(data.testType),
          stringToHex(data.testDate),
          stringToHex(data.result),
          stringToHex(data.notes)
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in createClinicalTest:', error)
          throw new Error('Failed to create new patient. Please check the data and try again.')
        })

      return { status: 'success', message: 'Clinical Test created successfully.' }
    } catch (error) {
      this.handleError(error, 'createClinical')
    }
  }

  async updateClinicalTest(accountId: string, data: BlockchainUpdateClinicalTestDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .updateClinicalTest(
          stringToHex(data.testId.toString()),
          data.testType ? stringToHex(data.testType) : null,
          data.testDate ? stringToHex(data.testDate) : null,
          data.result ? stringToHex(data.result) : null,
          data.notes ? stringToHex(data.notes) : null
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in updateClinicalTest:', error)
          throw new Error('Failed to update the clinical test. Please check the data and try again.')
        })

      return { status: 'success', message: 'Clinical Test updated successfully.' }
    } catch (error) {
      this.handleError(error, 'updateClinicalTest')
    }
  }

  async deleteClinicalTest(accountId: string, data: BlockchainDeleteClinicalTestDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .deleteClinicalTest(data.testId)
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in deleteClinicalTest:', error)
          throw new Error('Failed to delete the clinical test. Please check the data and try again.')
        })

      return { status: 'success', message: 'Clinical Test deleted successfully.' }
    } catch (error) {
      this.handleError(error, 'deleteClinicalTest')
    }
  }

  async createDiseaseProgression(accountId: string, data: BlockchainCreateDiseaseProgressionDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .createDiseaseProgression(
          stringToHex(data.patientId.toString()),
          stringToHex(data.visitDate),
          stringToHex(data.symptoms),
          stringToHex(data.diagnosis),
          stringToHex(data.treatment),
          stringToHex(data.prescription),
          stringToHex(data.nextAppointment)
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in createDiseaseProgression:', error)
          throw new Error('Failed to create disease progression. Please check the data and try again.')
        })

      return { status: 'success', message: 'Disease Progression created successfully.' }
    } catch (error) {
      this.handleError(error, 'createDiseaseProgression')
    }
  }

  async updateDiseaseProgression(accountId: string, data: BlockchainUpdateDiseaseProgressionDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .updateDiseaseProgression(
          stringToHex(data.progressionId.toString()),
          data.visitDate ? stringToHex(data.visitDate) : null,
          data.symptoms ? stringToHex(data.symptoms) : null,
          data.diagnosis ? stringToHex(data.diagnosis) : null,
          data.treatment ? stringToHex(data.treatment) : null,
          data.prescription ? stringToHex(data.prescription) : null,
          data.nextAppointment ? stringToHex(data.nextAppointment) : null
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in updateDiseaseProgression:', error)
          throw new Error('Failed to update the disease progression. Please check the data and try again.')
        })

      return { status: 'success', message: 'Disease Progression updated successfully.' }
    } catch (error) {
      this.handleError(error, 'updateDiseaseProgression')
    }
  }

  async deleteDiseaseProgression(accountId: string, data: BlockchainDeleteDiseaseProgressionDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .deleteDiseaseProgression(stringToHex(data.progressionId.toString()))
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in deleteDiseaseProgression:', error)
          throw new Error('Failed to delete the disease progression. Please check the data and try again.')
        })

      return { status: 'success', message: 'Disease Progression deleted successfully.' }
    } catch (error) {
      this.handleError(error, 'deleteDiseaseProgression')
    }
  }

  async createMedicalRecord(accountId: string, data: BlockchainCreateMedicalRecordDto) {
    try {
      const api = await ApiPromise.create({ provider: this.provider })
      const account = await prisma.account.findFirst({
        where: { id: accountId },
        select: {
          walletMnemonic: true,
          walletAddress: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      const walletMnemonic = decryptString(account.walletMnemonic, configs.secrets.secretKey)

      const pair = this.keyring.addFromMnemonic(walletMnemonic)
      // this.forceSetBalance(account.walletAddress, BigInt(1000000000000000))
      const unsub = await api.tx.medicalRecord
        .createMedicalRecord(
          stringToHex(data.patientId.toString()),
          stringToHex(data.diagnosis),
          stringToHex(data.treatment),
          data.dataPointer ? stringToHex(data.dataPointer.toString()) : null
        )
        .signAndSend(pair, (result) => {
          console.log(`Current status is ${result.status}`)

          if (result.status.isInBlock) {
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            unsub()
          }
        })
        .catch((error) => {
          console.error('Error in createMedicalRecords:', error)
          throw new Error('Failed to create the medical records. Please check the data and try again.')
        })

      return { status: 'success', message: 'Medical Record created successfully.' }
    } catch (error) {
      this.handleError(error, 'createMedicalRecords')
    }
  }

  private async parsePatientData(patient: any) {
    console.log(patient.phone)
    const lastModifiedByAccount = await prisma.account.findFirst({
      where: {
        walletAddress: patient.lastModifiedBy
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        avatar: {
          select: {
            id: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true
          }
        },
        staff: {
          select: {
            id: true,
            positions: {
              include: {
                position: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const createdByAccount = await prisma.account.findFirst({
      where: {
        walletAddress: patient.createdBy
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        avatar: {
          select: {
            id: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true
          }
        },
        staff: {
          select: {
            id: true,
            positions: {
              include: {
                position: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return {
      patientId: patient.id,
      patientName: hexToString(patient.patientName as string),
      dateOfBirth: hexToDate(patient.dateOfBirth as string),
      gender: hexToString(patient.gender as string),
      address: hexToString(patient.address as string),
      phoneNumber: hexToString(patient.phone as string),
      emergencyContact: hexToString(patient.emergencyContact as string),
      createdAt: patient.createdAt,
      createdBy: patient.createdBy,
      createByAccount: createdByAccount,
      lastModifiedAt: patient.lastModifiedAt,
      lastModifiedBy: patient.lastModifiedBy,
      lastModifiedByAccount: lastModifiedByAccount
    }
  }
}
