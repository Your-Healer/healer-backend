import BlockchainService from '~/services/blockchain.service'

const blockchainService = BlockchainService.getInstance()

export async function getAllExtrinsicTransactions() {
  return await blockchainService.getExtrinsic()
}
