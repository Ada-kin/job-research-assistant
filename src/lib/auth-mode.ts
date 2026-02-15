export function isAuthDisabledForLocal(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DISABLE_AUTH_LOCAL === 'true';
}

