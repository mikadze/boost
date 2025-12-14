import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoBadges } from '../demo-badges';

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

describe('DemoBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<DemoBadges userId="demo_bronze" />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('displays badges earned count', () => {
    render(<DemoBadges userId="demo_bronze" />);
    expect(screen.getByText(/Badges Earned/)).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    render(<DemoBadges userId="demo_bronze" />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows badges for bronze user', () => {
    render(<DemoBadges userId="demo_bronze" />);
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getByText('Window Shopper')).toBeInTheDocument();
  });

  it('shows more badges for gold user', () => {
    render(<DemoBadges userId="demo_gold" />);
    expect(screen.getByText('VIP Legend')).toBeInTheDocument();
    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('filters badges when clicking Earned tab', () => {
    render(<DemoBadges userId="demo_silver" />);

    // Click the Earned filter
    fireEvent.click(screen.getByText('Earned'));

    // Should show unlocked badges
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getByText('First Purchase')).toBeInTheDocument();
  });

  it('filters badges when clicking Locked tab', () => {
    render(<DemoBadges userId="demo_silver" />);

    // Click the Locked filter
    fireEvent.click(screen.getByText('Locked'));

    // Should show locked badges
    expect(screen.getByText('Loyal Customer')).toBeInTheDocument();
    expect(screen.getByText('Social Star')).toBeInTheDocument();
  });

  it('calls addLog when refresh is clicked', async () => {
    render(<DemoBadges userId="demo_bronze" />);

    // Click the Refresh button
    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(mockAddLog).toHaveBeenCalledWith({
        type: 'request',
        method: 'GET',
        endpoint: '/v1/customer/badges',
        data: { userId: 'demo_bronze' },
      });
    });
  });

  it('displays rarity labels for badges', () => {
    render(<DemoBadges userId="demo_bronze" />);
    expect(screen.getAllByText('Common').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rare').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Epic').length).toBeGreaterThan(0);
  });

  it('shows empty state for new user with no earned badges', () => {
    render(<DemoBadges userId="demo_new" />);

    // Click the Earned filter
    fireEvent.click(screen.getByText('Earned'));

    // Should show empty state
    expect(screen.getByText('No badges found')).toBeInTheDocument();
  });
});
