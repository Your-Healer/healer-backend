import config from '../configs/env'

export default class PaymentService {
  private static instance: PaymentService
  // private vnpay: VNPay
  private constructor() {
    // Private constructor to prevent instantiation
    // this.vnpay = new VNPay({
    //   tmnCode: config.secrets.vnpay.tmncode,
    //   secureSecret: config.secrets.vnpay.secureSecret,
    //   vnpayHost: config.secrets.vnpay.host,
    //   testMode: config.secrets.vnpay.testMode
    // })
  }
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  buildPaymentUrl({
    orderId,
    orderAmount,
    ipAddress
  }: {
    orderId: string
    orderAmount: number
    ipAddress: string
  }): any {
    // return {
    //   success: true,
    //   paymentUrl
    // }
  }
}
