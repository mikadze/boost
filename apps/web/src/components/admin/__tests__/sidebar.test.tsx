import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../sidebar';

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/dashboard');
  });

  it('renders the Boost logo and title', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Boost')).toBeInTheDocument();
  });

  it('renders the Overview link', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders the Growth collapsible group', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });

  it('renders the Loyalty collapsible group', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
  });

  it('renders the Engine collapsible group', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Engine')).toBeInTheDocument();
  });

  it('renders the Data collapsible group', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('renders the Settings collapsible group', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the Playground link', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Playground')).toBeInTheDocument();
  });

  it('expands Growth group to show Onboarding and Referrals', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Click on Growth to expand
    fireEvent.click(screen.getByText('Growth'));

    // Check for child items
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
  });

  it('expands Loyalty group to show Tiers & Points and Achievements', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Click on Loyalty to expand
    fireEvent.click(screen.getByText('Loyalty'));

    // Check for child items
    expect(screen.getByText('Tiers & Points')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('expands Engine group to show Automations and Rewards', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Click on Engine to expand
    fireEvent.click(screen.getByText('Engine'));

    // Check for child items
    expect(screen.getByText('Automations')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
  });

  it('expands Data group to show Customers and Events Log', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Click on Data to expand
    fireEvent.click(screen.getByText('Data'));

    // Check for child items
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Events Log')).toBeInTheDocument();
  });

  it('expands Settings group to show API Keys, Webhooks, and General', () => {
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Click on Settings to expand
    fireEvent.click(screen.getByText('Settings'));

    // Check for child items
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Webhooks')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    // Click the close button
    const closeButton = screen.getByLabelText('Close sidebar');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('applies correct classes when sidebar is closed', () => {
    const { container } = render(<Sidebar isOpen={false} onClose={() => {}} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
  });

  it('applies correct classes when sidebar is open', () => {
    const { container } = render(<Sidebar isOpen={true} onClose={() => {}} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
  });

  it('auto-expands group when child route is active', () => {
    mockPathname.mockReturnValue('/dashboard/quests');
    render(<Sidebar isOpen={true} onClose={() => {}} />);

    // Growth group should be expanded because /dashboard/quests is under Onboarding
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });
});
