import { auth } from '@/auth';
import { isAuthDisabledForLocal } from '@/lib/auth-mode';

export const LOCAL_DEV_USER_ID = 'local-dev-user';

export async function getCurrentUserId(): Promise<string | null> {
  if (isAuthDisabledForLocal()) {
    return LOCAL_DEV_USER_ID;
  }

  const session = await auth();
  return session?.user?.id || null;
}
