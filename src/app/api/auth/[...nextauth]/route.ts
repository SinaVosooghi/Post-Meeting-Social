/**
 * NextAuth.js API Route Handler
 * Post-Meeting Social Media Content Generator
 *
 * Handles OAuth authentication for Google Calendar, LinkedIn, and Facebook
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
