'use client';

import * as React from 'react';
import { GamifyProvider, type GamifyConfig } from '@gamify/react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'event' | 'error';
  method?: string;
  endpoint?: string;
  data: unknown;
  duration?: number;
}

interface DemoContextValue {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  endpoint: string;
  projectName: string | null;
  isConnectedToProject: boolean;
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

// Demo API key for playground - should be set via NEXT_PUBLIC_DEMO_API_KEY env variable
// Falls back to a placeholder that prompts users to set up their own key
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_DEMO_API_KEY ?? 'pk_live_demo_key_not_configured';
const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'boost_demo_api_key';

export function useDemoContext() {
  const context = React.useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
}

export function useAddLog() {
  const { addLog } = useDemoContext();
  return addLog;
}

interface DemoProviderProps {
  children: React.ReactNode;
  initialApiKey?: string;
  projectName?: string;
}

export function DemoProvider({ children, initialApiKey, projectName }: DemoProviderProps) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [apiKey, setApiKeyState] = React.useState(initialApiKey || DEFAULT_API_KEY);
  const [isClient, setIsClient] = React.useState(false);
  const [connectedProjectName, setConnectedProjectName] = React.useState<string | null>(projectName || null);

  // Load API key from localStorage on client, but prefer initialApiKey if provided
  React.useEffect(() => {
    setIsClient(true);
    if (initialApiKey) {
      // If initialApiKey is provided (from organization), use it
      setApiKeyState(initialApiKey);
      setConnectedProjectName(projectName || null);
    } else {
      // Otherwise, try to load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
        setConnectedProjectName(null);
      }
    }
  }, [initialApiKey, projectName]);

  const setApiKey = React.useCallback((key: string) => {
    setApiKeyState(key);
    setConnectedProjectName(null); // Clear project name when manually setting key
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, key);
    }
  }, []);

  const addLog = React.useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 100)); // Keep last 100 entries
  }, []);

  const clearLogs = React.useCallback(() => {
    setLogs([]);
  }, []);

  const gamifyConfig: GamifyConfig = React.useMemo(() => ({
    apiKey,
    endpoint: DEFAULT_ENDPOINT,
    debug: true,
  }), [apiKey]);

  const isConnectedToProject = !!connectedProjectName && !!initialApiKey;

  const contextValue: DemoContextValue = React.useMemo(() => ({
    logs,
    addLog,
    clearLogs,
    apiKey,
    setApiKey,
    endpoint: DEFAULT_ENDPOINT,
    projectName: connectedProjectName,
    isConnectedToProject,
  }), [logs, addLog, clearLogs, apiKey, setApiKey, connectedProjectName, isConnectedToProject]);

  // Don't render GamifyProvider until client-side
  if (!isClient) {
    return (
      <DemoContext.Provider value={contextValue}>
        {children}
      </DemoContext.Provider>
    );
  }

  return (
    <DemoContext.Provider value={contextValue}>
      <GamifyProvider config={gamifyConfig}>
        {children}
      </GamifyProvider>
    </DemoContext.Provider>
  );
}
