import FormData from 'form-data'
import Mailgun from 'mailgun.js'
import config from '../../configs/env'

const mailGun = new Mailgun(FormData)

const mg = mailGun.client({
  username: 'api',
  key: config.secrets.mail.apiKey
})

export default mg
