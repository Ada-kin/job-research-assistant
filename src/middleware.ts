export { auth as middleware } from '@/auth';

export const config = {
  matcher: ['/', '/cv/:path*', '/applications/:path*', '/settings/:path*']
};
