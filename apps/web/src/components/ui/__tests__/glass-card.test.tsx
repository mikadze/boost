import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from '../glass-card';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(<GlassCard>Card content</GlassCard>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    expect(container.firstChild).toHaveClass('glass');
  });

  it('applies strong variant class', () => {
    const { container } = render(<GlassCard variant="strong">Content</GlassCard>);
    expect(container.firstChild).toHaveClass('glass-strong');
  });

  it('applies subtle variant class', () => {
    const { container } = render(<GlassCard variant="subtle">Content</GlassCard>);
    expect(container.firstChild).toHaveClass('glass-subtle');
  });

  it('applies glow class when glow prop is true', () => {
    const { container } = render(<GlassCard glow>Content</GlassCard>);
    expect(container.firstChild).toHaveClass('glow');
  });

  it('applies custom className', () => {
    const { container } = render(<GlassCard className="custom-class">Content</GlassCard>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('GlassCardHeader', () => {
  it('renders children correctly', () => {
    render(<GlassCardHeader>Header content</GlassCardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('GlassCardTitle', () => {
  it('renders as h3 element', () => {
    render(<GlassCardTitle>Title</GlassCardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
  });
});

describe('GlassCardDescription', () => {
  it('renders as p element', () => {
    render(<GlassCardDescription>Description</GlassCardDescription>);
    const desc = screen.getByText('Description');
    expect(desc.tagName).toBe('P');
  });
});

describe('GlassCardContent', () => {
  it('renders children correctly', () => {
    render(<GlassCardContent>Content</GlassCardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('GlassCardFooter', () => {
  it('renders children correctly', () => {
    render(<GlassCardFooter>Footer content</GlassCardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
