/**
 * Providers Component
 * Post-Meeting Social Media Content Generator
 *
 * Wraps the application with necessary context providers
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return <SessionProvider session={session || null}>{children}</SessionProvider>;
}
