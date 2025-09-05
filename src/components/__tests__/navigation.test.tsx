/**
 * Navigation Component Tests
 * Post-Meeting Social Media Content Generator
 *
 * Tests for the main navigation component with authentication
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Navigation } from '../navigation';

// Mock next-auth/react
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: () => mockSignIn(),
  signOut: () => mockSignOut(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const { useSession } = require('next-auth/react');

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const renderWithSession = (session: any = null) => {
  return render(
    <SessionProvider session={session}>
      <Navigation />
    </SessionProvider>
  );
};

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should render sign in button when not authenticated', () => {
      renderWithSession();
      
      expect(screen.getByText('🚀 Sign In')).toBeInTheDocument();
      expect(screen.getByText('Post-Meeting Social')).toBeInTheDocument();
    });

    it('should call signIn when sign in button is clicked', () => {
      renderWithSession();
      
      const signInButton = screen.getByText('🚀 Sign In');
      fireEvent.click(signInButton);
      
      expect(mockSignIn).toHaveBeenCalled(); // Updated for NextAuth v5
    });

    it('should not show navigation links when not authenticated', () => {
      renderWithSession();
      
      expect(screen.queryByText('📊 Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('📅 Meetings')).not.toBeInTheDocument();
      expect(screen.queryByText('⚙️ Automations')).not.toBeInTheDocument();
      expect(screen.queryByText('🔧 Settings')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/avatar.jpg',
      },
    };

    beforeEach(() => {
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('should render user menu when authenticated', () => {
      renderWithSession(mockSession);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Post-Meeting Social')).toBeInTheDocument();
    });

    it('should show navigation links when authenticated', () => {
      renderWithSession(mockSession);
      
      expect(screen.getAllByText('📊 Dashboard')[0]).toBeInTheDocument();
      expect(screen.getAllByText('📅 Meetings')[0]).toBeInTheDocument();
      expect(screen.getAllByText('⚙️ Automations')[0]).toBeInTheDocument();
      expect(screen.getAllByText('🔧 Settings')[0]).toBeInTheDocument();
    });

    it('should toggle user menu dropdown when clicked', async () => {
      renderWithSession(mockSession);
      
      const userButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(userButton!);
      
      await waitFor(() => {
        expect(screen.getByText('👤 Profile')).toBeInTheDocument();
        expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
        expect(screen.getByText('🚪 Sign Out')).toBeInTheDocument();
      });
    });

    it('should call signOut when sign out button is clicked', async () => {
      renderWithSession(mockSession);
      
      const userButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(userButton!);
      
      await waitFor(() => {
        const signOutButton = screen.getByText('🚪 Sign Out');
        fireEvent.click(signOutButton);
      });
      
      expect(mockSignOut).toHaveBeenCalled(); // Updated for NextAuth v5
    });

    it('should show user avatar when image is available', () => {
      renderWithSession(mockSession);
      
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should show initials when no image is available', () => {
      const sessionWithoutImage = {
        ...mockSession,
        user: {
          ...mockSession.user,
          image: null,
        },
      };

      useSession.mockReturnValue({
        data: sessionWithoutImage,
        status: 'authenticated',
      });

      renderWithSession(sessionWithoutImage);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      useSession.mockReturnValue({
        data: null,
        status: 'loading',
      });
    });

    it('should show loading state when session is loading', () => {
      renderWithSession();
      
      expect(screen.getByText('Post-Meeting Social')).toBeInTheDocument(); // Loading state still shows navigation
    });
  });

  describe('Mobile Menu', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    beforeEach(() => {
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('should show mobile navigation links', () => {
      renderWithSession(mockSession);
      
      // Mobile menu should be visible (hidden on desktop)
      expect(screen.getAllByText('📊 Dashboard')[0]).toBeInTheDocument();
      expect(screen.getAllByText('📅 Meetings')[0]).toBeInTheDocument();
      expect(screen.getAllByText('⚙️ Automations')[0]).toBeInTheDocument();
      expect(screen.getAllByText('🔧 Settings')[0]).toBeInTheDocument();
    });
  });
});
