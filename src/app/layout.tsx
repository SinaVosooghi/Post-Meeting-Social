import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-wrapper';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Post-Meeting Social Content Generator',
  description:
    'AI-powered solution for financial advisors to automatically generate and publish social media content from meeting transcripts',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authConfig);
  
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}