import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';

export const supabase = createClient(
  appConfig.supabaseUrl,
  appConfig.supabaseAnonKey
);
