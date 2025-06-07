import config from '~/configs/env/index'
import mg from '~/libs/mailgun/init'

export default class EmailService {
  private static instance: EmailService

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(data: { to?: string | string[]; subject?: string; text: string }) {
    const result = await mg.messages.create('sandboxa38bfcf062d741e8a40b11002e3ee500.mailgun.org', {
      from: 'Your Healer <postmaster@sandboxa38bfcf062d741e8a40b11002e3ee500.mailgun.org>',
      to: data.to,
      subject: data.subject,
      text: data.text
    })

    return result
  }
}
