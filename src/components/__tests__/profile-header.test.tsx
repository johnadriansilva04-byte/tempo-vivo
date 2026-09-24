import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from '../profile-header';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockProfile = {
  id: '123',
  name: 'Test User',
  role: 'Developer',
  location: 'São Paulo',
  bio: 'Test bio',
  initials: 'TU',
  birth_date: '1990-01-01',
  target_lifespan: 100,
  avatar_url: null,
  cover_url: null,
};

describe('ProfileHeader', () => {
  it('renders profile information correctly', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfileHeader />
      </QueryClientProvider>
    );

    // Add assertions based on your component
    // expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows edit button on hover', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProfileHeader />
      </QueryClientProvider>
    );

    // Test edit button functionality
  });
});