import NextAuth from '@/lib/auth-wrapper';

const handler = NextAuth;

export { handler as GET, handler as POST };
