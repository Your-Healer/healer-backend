import config from '../env'
import { createClient } from '@supabase/supabase-js'

const url = config.secrets.db
const key = config.secrets.secretKey

export default createClient(url, key)
