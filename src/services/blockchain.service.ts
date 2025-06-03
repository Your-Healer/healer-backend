import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import {
  cryptoWaitReady,
  ed25519PairFromSeed,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  randomAsU8a
} from '@polkadot/util-crypto'
import 'dotenv/config'

const SUSTRATE_HOST = process.env.SUSTRATE_HOST
export default class BlockchainService {
  private static instance: BlockchainService
  private provider: WsProvider

  private constructor() {
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
}
