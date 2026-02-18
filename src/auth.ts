import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { isAuthDisabledForLocal } from '@/lib/auth-mode';

function authLog(message: string, payload?: Record<string, unknown>) {
  if (process.env.AUTH_DEBUG !== 'true') {
    return;
  }
  console.info(`[auth-debug] ${message}`, payload || {});
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  pages: {
    signIn: '/login'
  },
  callbacks: {
    jwt({ token, user, account }) {
      const userId = typeof user?.id === 'string' ? user.id : undefined;
      if (userId) {
        token.id = userId;
      }
      authLog('jwt callback', {
        hasUser: Boolean(user),
        userId,
        tokenSub: token.sub,
        tokenId: token.id,
        provider: account?.provider
      });
      return token;
    },
    session({ session, token }) {
      if (!session?.user) {
        authLog('session callback (no session.user)', {
          tokenSub: token?.sub,
          tokenId: token?.id
        });
        return session;
      }

      const tokenId = typeof token?.id === 'string' ? token.id : undefined;
      const tokenSub = typeof token?.sub === 'string' ? token.sub : undefined;
      const resolvedId = tokenId || tokenSub || '';
      session.user.id = resolvedId;

      authLog('session callback', {
        sessionUserEmail: session.user?.email,
        sessionUserId: session.user?.id,
        tokenSub,
        tokenId
      });
      return session;
    },
    authorized({ auth: session, request }) {
      if (isAuthDisabledForLocal()) {
        authLog('authorized callback (bypass local)', {
          pathname: request.nextUrl.pathname
        });
        return true;
      }

      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(session?.user);
      const isAuthRoute = pathname.startsWith('/api/auth');
      const isPublicRoute = pathname === '/login';

      if (isAuthRoute) {
        return true;
      }

      if (isPublicRoute) {
        authLog('authorized callback (public route)', { pathname, isLoggedIn });
        return true;
      }

      authLog('authorized callback', {
        pathname,
        isLoggedIn,
        userEmail: session?.user?.email
      });
      return isLoggedIn;
    }
  },
  events: {
    signIn({ user, account }) {
      const userId = typeof user?.id === 'string' ? user.id : undefined;
      authLog('event signIn', {
        userId,
        email: user?.email,
        provider: account?.provider
      });
    },
    signOut(message) {
      const sessionUserId = 'session' in message ? message.session?.userId : undefined;
      const tokenSub = 'token' in message ? message.token?.sub : undefined;
      authLog('event signOut', {
        sessionUserId,
        tokenSub
      });
    }
  }
});
