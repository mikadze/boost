import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Badge</Badge>);
    expect(container.firstChild).toHaveClass('bg-primary');
    expect(container.firstChild).toHaveClass('text-primary-foreground');
  });

  it('applies secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Badge</Badge>);
    expect(container.firstChild).toHaveClass('bg-secondary');
    expect(container.firstChild).toHaveClass('text-secondary-foreground');
  });

  it('applies destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Badge</Badge>);
    expect(container.firstChild).toHaveClass('bg-destructive');
    expect(container.firstChild).toHaveClass('text-destructive-foreground');
  });

  it('applies outline variant', () => {
    const { container } = render(<Badge variant="outline">Badge</Badge>);
    expect(container.firstChild).toHaveClass('text-foreground');
    expect(container.firstChild).toHaveClass('border-border');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Badge</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with rounded-full class', () => {
    const { container } = render(<Badge>Badge</Badge>);
    expect(container.firstChild).toHaveClass('rounded-full');
  });
});
