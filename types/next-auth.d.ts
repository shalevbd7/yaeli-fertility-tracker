import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    trackerUserId?: string;
  }

  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      trackerUserId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    trackerUserId?: string;
  }
}
