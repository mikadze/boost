import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from '../avatar';

describe('Avatar', () => {
  it('renders with image when src is provided', () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders fallback when no src is provided', () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(<Avatar fallback="AB" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('shows fallback when image fails to load', () => {
    render(<Avatar src="invalid-url.jpg" alt="User" fallback="U" />);
    const img = screen.getByRole('img');

    fireEvent.error(img);

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders ? when no alt or fallback is provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies sm size', () => {
    const { container } = render(<Avatar size="sm" fallback="A" />);
    expect(container.firstChild).toHaveClass('h-8');
    expect(container.firstChild).toHaveClass('w-8');
  });

  it('applies default size', () => {
    const { container } = render(<Avatar fallback="A" />);
    expect(container.firstChild).toHaveClass('h-10');
    expect(container.firstChild).toHaveClass('w-10');
  });

  it('applies lg size', () => {
    const { container } = render(<Avatar size="lg" fallback="A" />);
    expect(container.firstChild).toHaveClass('h-12');
    expect(container.firstChild).toHaveClass('w-12');
  });

  it('applies xl size', () => {
    const { container } = render(<Avatar size="xl" fallback="A" />);
    expect(container.firstChild).toHaveClass('h-16');
    expect(container.firstChild).toHaveClass('w-16');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar className="custom-class" fallback="A" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
