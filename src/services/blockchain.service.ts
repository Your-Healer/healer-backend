import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { cryptoWaitReady, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto'
import configs from '../configs/env'
import { AllExtrinsics } from '~/utils/types'
import { SubmittableExtrinsicFunction } from '@polkadot/api/types'

const SUSTRATE_HOST = configs.secrets.substrateHost || process.env.SUBSTRATE_HOST

export default class BlockchainService {
  private static instance: BlockchainService
  private provider: WsProvider

  private constructor() {
    if (!SUSTRATE_HOST) {
      throw new Error('Substrate host is not configured.')
    }
    this.provider = new WsProvider(SUSTRATE_HOST)
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

    console.log(map)

    return map as AllExtrinsics
  }
}
