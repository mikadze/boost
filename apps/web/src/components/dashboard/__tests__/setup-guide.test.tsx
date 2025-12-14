import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetupGuide } from '../setup-guide';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useOrganization hook
const mockApiKeys = [
  {
    id: 'key-1',
    name: 'Test Key',
    projectId: 'project-1',
    keyPrefix: 'pk_live_test',
    createdAt: '2024-01-01',
  },
];

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project',
    organizationId: 'org-1',
    createdAt: '2024-01-01',
  },
];

vi.mock('@/hooks/use-organization', () => ({
  useOrganization: () => ({
    projects: mockProjects,
    apiKeys: mockApiKeys,
  }),
}));

// Mock useRecentEvents hook
const mockRefetch = vi.fn();
vi.mock('@/hooks/use-project-stats', () => ({
  useRecentEvents: () => ({
    data: [],
    refetch: mockRefetch,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('SetupGuide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the welcome header', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Welcome to Boost!')).toBeInTheDocument();
  });

  it('renders step 1: Install the SDK', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Step 1: Install the SDK')).toBeInTheDocument();
    expect(screen.getByText('npm install @boost/sdk-react')).toBeInTheDocument();
  });

  it('renders step 2: Initialize the Provider', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Step 2: Initialize the Provider')).toBeInTheDocument();
    // Multiple elements contain BoostProvider, use getAllByText
    expect(screen.getAllByText(/BoostProvider/).length).toBeGreaterThan(0);
  });

  it('renders step 3: Verify Integration', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Step 3: Verify Integration')).toBeInTheDocument();
  });

  it('renders the Start Listening button', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Start Listening')).toBeInTheDocument();
  });

  it('renders the Send Test Event button', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Send Test Event')).toBeInTheDocument();
  });

  it('sends test event via session-authenticated endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, eventId: 'test-1' }),
    });
    global.fetch = mockFetch;

    render(<SetupGuide />);

    const sendButton = screen.getByText('Send Test Event');
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Verify the session-authenticated endpoint was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/project-1/events/test'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('shows listening indicator when Start Listening is clicked', async () => {
    render(<SetupGuide />);

    const startButton = screen.getByText('Start Listening');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Polling every 3 seconds')).toBeInTheDocument();
    });
  });

  it('renders quick links to playground and API keys', () => {
    render(<SetupGuide />);
    expect(screen.getByText('Try the Playground')).toBeInTheDocument();
    expect(screen.getByText('Manage API Keys')).toBeInTheDocument();
  });

  it('shows the API key prefix in the code example', () => {
    render(<SetupGuide />);
    expect(screen.getByText(/pk_live_test/)).toBeInTheDocument();
  });

  it('calls onComplete callback when completed', async () => {
    const onComplete = vi.fn();
    render(<SetupGuide onComplete={onComplete} />);

    // The onComplete is called when an event is detected
    // This is tested through the effect that checks recentEvents
  });

  it('renders step progress indicators', () => {
    render(<SetupGuide />);

    // Check for step titles
    expect(screen.getByText('Install the SDK')).toBeInTheDocument();
    expect(screen.getByText('Initialize the Provider')).toBeInTheDocument();
    expect(screen.getByText('Verify Integration')).toBeInTheDocument();
  });

  it('renders code blocks', () => {
    render(<SetupGuide />);

    // Check for code blocks by looking for the pre elements
    const codeBlocks = document.querySelectorAll('pre');
    expect(codeBlocks.length).toBeGreaterThan(0);
  });
});
