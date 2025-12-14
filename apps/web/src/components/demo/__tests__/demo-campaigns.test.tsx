import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoCampaigns } from '../demo-campaigns';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock demo-provider
const mockAddLog = vi.fn();
vi.mock('../demo-provider', () => ({
  useAddLog: () => mockAddLog,
}));

describe('DemoCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getByText('Automations')).toBeInTheDocument();
  });

  it('displays active rules count', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getByText('Active Rules')).toBeInTheDocument();
  });

  it('displays user triggers count', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getByText('Your Triggers')).toBeInTheDocument();
  });

  it('renders view tabs', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getByText('My History')).toBeInTheDocument();
  });

  it('shows active campaigns', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getByText('Welcome Bonus')).toBeInTheDocument();
    expect(screen.getByText('Double Points Weekend')).toBeInTheDocument();
    expect(screen.getByText('Big Spender Reward')).toBeInTheDocument();
  });

  it('shows campaign details when expanded', () => {
    render(<DemoCampaigns userId="demo_bronze" />);

    // Click on the Welcome Bonus campaign to expand
    fireEvent.click(screen.getByText('Welcome Bonus'));

    // Should show rule details
    expect(screen.getByText('user_login')).toBeInTheDocument();
  });

  it('shows user history when switching to My History tab', () => {
    render(<DemoCampaigns userId="demo_silver" />);

    // Click My History tab
    fireEvent.click(screen.getByText('My History'));

    // Should show trigger history
    expect(screen.getByText('First Login Reward')).toBeInTheDocument();
    expect(screen.getByText('+500 points')).toBeInTheDocument();
  });

  it('shows empty history for new user', () => {
    render(<DemoCampaigns userId="demo_new" />);

    // Click My History tab
    fireEvent.click(screen.getByText('My History'));

    // Should show empty state
    expect(screen.getByText('No triggers yet')).toBeInTheDocument();
  });

  it('shows more trigger history for gold user', () => {
    render(<DemoCampaigns userId="demo_gold" />);

    // Click My History tab
    fireEvent.click(screen.getByText('My History'));

    // Should show multiple triggers
    expect(screen.getByText('Referral Bonus')).toBeInTheDocument();
    expect(screen.getByText('+1000 points')).toBeInTheDocument();
  });

  it('calls addLog when refresh is clicked', async () => {
    render(<DemoCampaigns userId="demo_bronze" />);

    // Click the Refresh button
    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(mockAddLog).toHaveBeenCalledWith({
        type: 'request',
        method: 'GET',
        endpoint: '/v1/customer/campaigns/history',
        data: { userId: 'demo_bronze' },
      });
    });
  });

  it('displays campaign status badges', () => {
    render(<DemoCampaigns userId="demo_bronze" />);
    expect(screen.getAllByText('active').length).toBeGreaterThan(0);
  });
});
