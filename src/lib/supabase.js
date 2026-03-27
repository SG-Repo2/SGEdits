import { createClient } from '@supabase/supabase-js';
import { appConfig } from '../config/appConfig';

export const supabase = appConfig.isDemoMode
  ? null
  : createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
