/**
 * Authentication Error Page
 * Post-Meeting Social Media Content Generator
 *
 * Handles authentication errors with user-friendly messages
 */

'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ERROR_MESSAGES = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access was denied. Please try again.',
  Verification: 'The verification link was invalid or has expired.',
  Default: 'An unexpected error occurred during authentication.',
} as const;

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') as keyof typeof ERROR_MESSAGES;

  const errorMessage = ERROR_MESSAGES[error] || ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-lg text-gray-600 mb-8">Something went wrong during sign in</p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Details</h2>
              <p className="text-gray-700">{errorMessage}</p>
              {error && <p className="text-sm text-gray-500 mt-2">Error Code: {error}</p>}
            </div>

            <div className="space-y-4">
              <Link
                href="/auth/signin"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🔄 Try Again
              </Link>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🏠 Go Home
              </Link>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Troubleshooting Tips</h3>
            <div className="space-y-3 text-sm text-gray-600 text-left">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                <div>
                  <strong>Clear your browser cache</strong> and try signing in again
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                <div>
                  <strong>Check your internet connection</strong> and ensure you can access Google
                  services
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                <div>
                  <strong>Make sure you&apos;re using a supported browser</strong> with JavaScript
                  enabled
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                <div>
                  <strong>Disable browser extensions</strong> that might interfere with
                  authentication
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>If the problem persists, please contact support</p>
        </div>
      </div>
    </div>
  );
}
