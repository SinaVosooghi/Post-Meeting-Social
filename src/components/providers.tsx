/**
 * Providers Component
 * Post-Meeting Social Media Content Generator
 *
 * Wraps the application with necessary context providers
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import type { ProvidersProps } from '@/types';

export function Providers({ children, session }: ProvidersProps) {
  return <SessionProvider session={session || null}>{children as React.ReactNode}</SessionProvider>;
}
