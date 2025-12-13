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
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

const DEFAULT_API_KEY = 'pk_live_31d08b51fca1ec234f09279cbac1f82222e896bf593d755715423a034e7bc67f';
const DEFAULT_ENDPOINT = 'http://localhost:3000';
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
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [apiKey, setApiKeyState] = React.useState(DEFAULT_API_KEY);
  const [isClient, setIsClient] = React.useState(false);

  // Load API key from localStorage on client
  React.useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  const setApiKey = React.useCallback((key: string) => {
    setApiKeyState(key);
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

  const contextValue: DemoContextValue = React.useMemo(() => ({
    logs,
    addLog,
    clearLogs,
    apiKey,
    setApiKey,
    endpoint: DEFAULT_ENDPOINT,
  }), [logs, addLog, clearLogs, apiKey, setApiKey]);

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
