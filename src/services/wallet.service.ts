import { Keyring } from '@polkadot/api'
import { cryptoWaitReady, randomAsU8a } from '@polkadot/util-crypto'

export default class WalletService {
  private static instance: WalletService

  private constructor() {}

  static getInstance() {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  async createNewWallet() {
    await cryptoWaitReady()
    const keyring = new Keyring({ type: 'sr25519' })
    const seed = randomAsU8a(32)
    const pair = keyring.addFromSeed(seed)

    return pair
  }
}
