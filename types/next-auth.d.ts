import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId: string;
      discordUsername: string;
      discordAvatar: string;
      role: 'admin' | 'matchmaker' | 'player' | 'spectator';
    };
  }

  interface User {
    discordId?: string;
    discordUsername?: string;
    discordAvatar?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discordId?: string;
    discordUsername?: string;
    discordAvatar?: string;
    role?: string;
  }
}
