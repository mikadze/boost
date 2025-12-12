import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../status-badge';

describe('StatusBadge', () => {
  it('renders children correctly', () => {
    render(<StatusBadge>Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<StatusBadge>Status</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-muted');
  });

  it('applies active variant', () => {
    const { container } = render(<StatusBadge variant="active">Active</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-green-500/10');
    expect(container.firstChild).toHaveClass('text-green-400');
  });

  it('applies inactive variant', () => {
    const { container } = render(<StatusBadge variant="inactive">Inactive</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-muted');
  });

  it('applies warning variant', () => {
    const { container } = render(<StatusBadge variant="warning">Warning</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-yellow-500/10');
    expect(container.firstChild).toHaveClass('text-yellow-400');
  });

  it('applies error variant', () => {
    const { container } = render(<StatusBadge variant="error">Error</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-red-500/10');
    expect(container.firstChild).toHaveClass('text-red-400');
  });

  it('applies info variant', () => {
    const { container } = render(<StatusBadge variant="info">Info</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-blue-500/10');
    expect(container.firstChild).toHaveClass('text-blue-400');
  });

  it('applies primary variant', () => {
    const { container } = render(<StatusBadge variant="primary">Primary</StatusBadge>);
    expect(container.firstChild).toHaveClass('bg-primary/10');
    expect(container.firstChild).toHaveClass('text-primary');
  });

  it('renders dot when dot prop is true', () => {
    const { container } = render(<StatusBadge variant="active" dot>Active</StatusBadge>);
    const dot = container.querySelector('.bg-green-400');
    expect(dot).toBeInTheDocument();
  });

  it('applies pulse animation when pulse prop is true', () => {
    const { container } = render(<StatusBadge variant="active" dot pulse>Active</StatusBadge>);
    const dot = container.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('applies sm size', () => {
    const { container } = render(<StatusBadge size="sm">Status</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-[10px]');
  });

  it('applies lg size', () => {
    const { container } = render(<StatusBadge size="lg">Status</StatusBadge>);
    expect(container.firstChild).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBadge className="custom-class">Status</StatusBadge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
