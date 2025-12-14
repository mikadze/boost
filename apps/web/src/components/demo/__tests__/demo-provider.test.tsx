import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemoProvider, useDemoContext } from '../demo-provider';

// Mock @gamify/react
vi.mock('@gamify/react', () => ({
  GamifyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component that uses the context
function TestComponent() {
  const { apiKey, projectName, isConnectedToProject, logs } = useDemoContext();
  return (
    <div>
      <span data-testid="api-key">{apiKey}</span>
      <span data-testid="project-name">{projectName || 'null'}</span>
      <span data-testid="connected">{isConnectedToProject ? 'true' : 'false'}</span>
      <span data-testid="logs-count">{logs.length}</span>
    </div>
  );
}

describe('DemoProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders children', () => {
    render(
      <DemoProvider>
        <div>Test Child</div>
      </DemoProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('provides default API key when no initialApiKey', async () => {
    await act(async () => {
      render(
        <DemoProvider>
          <TestComponent />
        </DemoProvider>
      );
    });

    // Default key starts with pk_live_
    const apiKey = screen.getByTestId('api-key').textContent;
    expect(apiKey).toContain('pk_live_');
  });

  it('uses initialApiKey when provided', async () => {
    await act(async () => {
      render(
        <DemoProvider initialApiKey="pk_custom_key" projectName="My Project">
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(screen.getByTestId('api-key').textContent).toBe('pk_custom_key');
  });

  it('sets projectName when provided', async () => {
    await act(async () => {
      render(
        <DemoProvider initialApiKey="pk_custom_key" projectName="My Project">
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(screen.getByTestId('project-name').textContent).toBe('My Project');
  });

  it('isConnectedToProject is true when both initialApiKey and projectName are provided', async () => {
    await act(async () => {
      render(
        <DemoProvider initialApiKey="pk_custom_key" projectName="My Project">
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(screen.getByTestId('connected').textContent).toBe('true');
  });

  it('isConnectedToProject is false without initialApiKey', async () => {
    await act(async () => {
      render(
        <DemoProvider>
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(screen.getByTestId('connected').textContent).toBe('false');
  });

  it('loads API key from localStorage when no initialApiKey', async () => {
    localStorageMock.getItem.mockReturnValue('pk_stored_key');

    await act(async () => {
      render(
        <DemoProvider>
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(localStorageMock.getItem).toHaveBeenCalledWith('boost_demo_api_key');
  });

  it('starts with empty logs', async () => {
    await act(async () => {
      render(
        <DemoProvider>
          <TestComponent />
        </DemoProvider>
      );
    });

    expect(screen.getByTestId('logs-count').textContent).toBe('0');
  });

  it('throws error when useDemoContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDemoContext must be used within a DemoProvider');

    consoleSpy.mockRestore();
  });
});
