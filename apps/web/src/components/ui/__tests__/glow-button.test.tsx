import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GlowButton } from '../glow-button';

describe('GlowButton', () => {
  it('renders children correctly', () => {
    render(<GlowButton>Click me</GlowButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<GlowButton onClick={handleClick}>Click me</GlowButton>);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies default variant', () => {
    const { container } = render(<GlowButton>Button</GlowButton>);
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('applies glow variant', () => {
    const { container } = render(<GlowButton variant="glow">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('glow');
  });

  it('applies gradient variant', () => {
    const { container } = render(<GlowButton variant="gradient">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('bg-gradient-to-r');
  });

  it('applies outline variant', () => {
    const { container } = render(<GlowButton variant="outline">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('border-primary/50');
  });

  it('applies ghost variant', () => {
    const { container } = render(<GlowButton variant="ghost">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('text-muted-foreground');
  });

  it('applies sm size', () => {
    const { container } = render(<GlowButton size="sm">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('h-8');
  });

  it('applies lg size', () => {
    const { container } = render(<GlowButton size="lg">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('h-12');
  });

  it('applies xl size', () => {
    const { container } = render(<GlowButton size="xl">Button</GlowButton>);
    expect(container.firstChild).toHaveClass('h-14');
  });

  it('is disabled when disabled prop is true', () => {
    render(<GlowButton disabled>Button</GlowButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders as child component when asChild is true', () => {
    render(
      <GlowButton asChild>
        <a href="/test">Link</a>
      </GlowButton>
    );
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument();
  });
});
