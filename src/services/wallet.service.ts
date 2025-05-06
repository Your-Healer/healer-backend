import { Keyring } from '@polkadot/api'
import {
  cryptoWaitReady,
  ed25519PairFromSeed,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  randomAsU8a
} from '@polkadot/util-crypto'
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
    const mnemonic = mnemonicGenerate(12)
    const isValidMnemonic = mnemonicValidate(mnemonic)

    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' })
    const pair = keyring.addFromMnemonic(mnemonic)

    return { mnemonic, isValidMnemonic, keyring, pair }
  }
}
