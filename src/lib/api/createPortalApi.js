import { appConfig } from '../../config/appConfig';
import { createLocalStorageAdapter } from '../adapters/localStorageAdapter';
import { createDemoPortalRepository } from '../repositories/demoPortalRepository';
import { createSupabasePortalRepository } from '../repositories/supabasePortalRepository';

export function createPortalApi() {
  if (appConfig.dataSource === 'supabase') {
    return createSupabasePortalRepository();
  }

  return createDemoPortalRepository({
    storage: createLocalStorageAdapter(),
  });
}
