/**
 * Authentication Pages Tests
 * Post-Meeting Social Media Content Generator
 *
 * Tests for sign-in and error pages
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '../auth/signin/page';
import AuthErrorPage from '../auth/error/page';

// Mock next-auth/react
const mockSignIn = jest.fn();
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (provider: string, options: Record<string, unknown>) => mockSignIn(provider, options),
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'error' ? 'AccessDenied' : null),
  }),
  useRouter: () => mockRouter,
}));

describe('Authentication Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
  });

  describe('Sign In Page', () => {
    it('should render sign in page with correct title and description', () => {
      render(<SignInPage />);

      expect(screen.getByText('🎯 Welcome to Post-Meeting Social')).toBeInTheDocument();
      expect(
        screen.getByText('Transform your meeting transcripts into engaging social media content')
      ).toBeInTheDocument();
    });

    it('should show Google sign in button', () => {
      render(<SignInPage />);

      const signInButton = screen.getByText('Continue with Google');
      expect(signInButton).toBeInTheDocument();
    });

    it('should show required permissions information', () => {
      render(<SignInPage />);

      expect(screen.getByText('Required Permissions:')).toBeInTheDocument();
      expect(
        screen.getByText('📅 Google Calendar access for meeting synchronization')
      ).toBeInTheDocument();
      expect(
        screen.getByText('👤 Basic profile information for personalization')
      ).toBeInTheDocument();
      expect(screen.getByText('📧 Email address for account management')).toBeInTheDocument();
    });

    it('should show features preview', () => {
      render(<SignInPage />);

      expect(screen.getByText('What you can do:')).toBeInTheDocument();
      expect(
        screen.getByText('Connect your Google Calendar and manage meeting bots')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Generate AI-powered social media posts from transcripts')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Create professional follow-up emails automatically')
      ).toBeInTheDocument();
      expect(screen.getByText('Configure automations for different platforms')).toBeInTheDocument();
    });

    it('should call signIn when Google button is clicked', async () => {
      render(<SignInPage />);

      const signInButton = screen.getByText('Continue with Google');
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard',
          redirect: true,
        });
      });
    });

    it('should show loading state when signing in', async () => {
      mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SignInPage />);

      const signInButton = screen.getByText('Continue with Google');
      fireEvent.click(signInButton);

      await waitFor(() => {
        const loadingButtons = screen.getAllByText('Signing in...');
        expect(loadingButtons.length).toBe(2);
      });
    });
  });

  describe('Auth Error Page', () => {
    it('should render error page with correct title', () => {
      render(<AuthErrorPage />);

      expect(screen.getByText('❌')).toBeInTheDocument();
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong during sign in')).toBeInTheDocument();
    });

    it('should show error details for AccessDenied error', () => {
      render(<AuthErrorPage />);

      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('Access was denied. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('Error Code: AccessDenied')).toBeInTheDocument();
    });

    it('should show try again and go home buttons', () => {
      render(<AuthErrorPage />);

      expect(screen.getByText('🔄 Try Again')).toBeInTheDocument();
      expect(screen.getByText('🏠 Go Home')).toBeInTheDocument();
    });

    it('should show troubleshooting tips', () => {
      render(<AuthErrorPage />);

      expect(screen.getByText('Troubleshooting Tips')).toBeInTheDocument();
      expect(screen.getByText('Clear your browser cache')).toBeInTheDocument();
      expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      expect(screen.getByText("Make sure you're using a supported browser")).toBeInTheDocument();
      expect(screen.getByText('Disable browser extensions')).toBeInTheDocument();
    });

    it('should have correct links', () => {
      render(<AuthErrorPage />);

      const tryAgainLink = screen.getByText('🔄 Try Again').closest('a');
      const goHomeLink = screen.getByText('🏠 Go Home').closest('a');

      expect(tryAgainLink).toHaveAttribute('href', '/auth/signin');
      expect(goHomeLink).toHaveAttribute('href', '/');
    });
  });
});
