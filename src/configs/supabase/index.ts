import config from '../env'
import { createClient } from '@supabase/supabase-js'

const url = config.secrets.supabase.url
const key = config.secrets.supabase.key

export default createClient(url, key)
