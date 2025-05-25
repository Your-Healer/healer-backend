import config from '../env'
import { createClient } from '@supabase/supabase-js'

const url = config.secrets.supabaseUrl
const key = config.secrets.supabaseKey

export default createClient(url, key)
