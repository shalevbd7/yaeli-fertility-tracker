import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { consumeRateLimit } from '@/lib/rate-limit';
import { RATE_LIMITS, clientIpFromHeaders } from '@/lib/rate-limit-core';

// bcrypt hash of a random throwaway value. Compared against when the email
// doesn't exist, so the response time doesn't reveal which emails exist.
const DUMMY_PASSWORD_HASH = '$2b$12$k8mmQBej2lW1lN1.2cYajOmpYch/SlciQJga2oSL/wsMiy/A0bMIy';

/** Thrown from authorize(); the login page shows a "too many attempts" message. */
export const RATE_LIMITED_ERROR = 'RATE_LIMITED';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const headers = (req?.headers ?? {}) as Record<string, string | string[] | undefined>;
        const ip = clientIpFromHeaders((name) => {
          const v = headers[name];
          return Array.isArray(v) ? v[0] : v;
        });
        const [ipOk, emailOk] = await Promise.all([
          consumeRateLimit(RATE_LIMITS.loginByIp, ip),
          consumeRateLimit(RATE_LIMITS.loginByEmail, email),
        ]);
        if (!ipOk || !emailOk) {
          throw new Error(RATE_LIMITED_ERROR);
        }

        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? user.email,
          trackerUserId: user.trackerUserId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.trackerUserId = user.trackerUserId;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.trackerUserId = token.trackerUserId as string;
        // Older sessions have no userId; NextAuth always sets `sub` to the user id.
        session.user.id = (token.userId as string | undefined) ?? token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
