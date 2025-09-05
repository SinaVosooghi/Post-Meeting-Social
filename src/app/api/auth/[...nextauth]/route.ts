/**
 * NextAuth.js API Route Handler
 * Post-Meeting Social Media Content Generator
 *
 * Handles OAuth authentication for Google Calendar, LinkedIn, and Facebook
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
