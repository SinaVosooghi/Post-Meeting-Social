/**
 * Sign In Page
 * Post-Meeting Social Media Content Generator
 *
 * Custom sign-in page with professional design for OAuth providers
 */

'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn('linkedin', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 Welcome to Post-Meeting Social
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Transform your meeting transcripts into engaging social media content
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sign in to get started</h2>

            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => {
                  void handleGoogleSignIn();
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  void handleLinkedInSignIn();
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A66C2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Sign in with LinkedIn
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 text-center space-y-2">
                <p>
                  <strong>Required Permissions:</strong>
                </p>
                <ul className="text-xs space-y-1">
                  <li>📅 Google Calendar access for meeting synchronization</li>
                  <li>👤 Basic profile information for personalization</li>
                  <li>📧 Email address for account management</li>
                  <li>🔗 LinkedIn profile for social media posting</li>
                  <li>📝 Permission to post on your LinkedIn profile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">What you can do:</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Connect your Google Calendar and manage meeting bots
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Generate AI-powered social media posts from transcripts
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Create professional follow-up emails automatically
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Configure automations for different platforms
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Built for Jump.ai Challenge • Secure OAuth Authentication</p>
        </div>
      </div>
    </div>
  );
}
