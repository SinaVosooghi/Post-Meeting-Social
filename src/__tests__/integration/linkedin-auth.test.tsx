import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '@/app/auth/signin/page';

// Mock next-auth/react module
const mockSession = {
  data: null,
  status: 'unauthenticated',
};

const mockSignIn = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock next/navigation
const mockRouter = { replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('LinkedIn Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.data = null;
    mockSession.status = 'unauthenticated';
  });

  it('should render LinkedIn sign in button', () => {
    render(<SignInPage />);
    const linkedInButton = screen.getByRole('button', { name: /sign in with linkedin/i });
    expect(linkedInButton).toBeInTheDocument();
  });

  it('should call signIn with linkedin provider when clicking LinkedIn button', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<SignInPage />);

    const linkedInButton = screen.getByRole('button', { name: /sign in with linkedin/i });
    fireEvent.click(linkedInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('linkedin', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    });
  });

  it('should redirect to dashboard after successful LinkedIn sign in', async () => {
    // Update session to simulate successful sign in
    mockSession.data = {
      user: { name: 'Test User', email: 'test@example.com' },
      expires: '2024-12-31',
    };
    mockSession.status = 'authenticated';

    render(<SignInPage />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle LinkedIn sign in errors', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('LinkedIn authentication failed'));
    render(<SignInPage />);

    const linkedInButton = screen.getByRole('button', { name: /sign in with linkedin/i });
    fireEvent.click(linkedInButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
    });
  });
});
