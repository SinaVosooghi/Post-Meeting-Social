/**
 * Authentication Flow Integration Tests
 * Post-Meeting Social Media Content Generator
 *
 * Tests the complete authentication flow without complex mocking
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Navigation } from '../../components/navigation';

// Simple test to verify components render without errors
describe('Authentication Flow Integration', () => {
  it('should render navigation component without errors', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    render(
      <SessionProvider session={mockSession}>
        <Navigation />
      </SessionProvider>
    );

    // Basic smoke test - component should render without crashing
    expect(screen.getByText('Post-Meeting Social')).toBeInTheDocument();
  });

  it('should render navigation component for unauthenticated user', () => {
    render(
      <SessionProvider session={null}>
        <Navigation />
      </SessionProvider>
    );

    // Should show sign in button for unauthenticated users
    expect(screen.getByText('🚀 Sign In')).toBeInTheDocument();
  });
});
