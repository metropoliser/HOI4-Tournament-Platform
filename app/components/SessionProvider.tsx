'use client';

import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';

function SessionHeartbeat() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 2 minutes
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, status]);

  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionHeartbeat />
      {children}
    </NextAuthSessionProvider>
  );
}
