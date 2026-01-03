'use client';

import { useState, useEffect } from 'react';

// Lazy-load better-auth client to avoid SSR issues
let authClient: ReturnType<typeof import('better-auth/react').createAuthClient> | null = null;

function getAuthClient() {
  if (!authClient && typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAuthClient } = require('better-auth/react');
    authClient = createAuthClient({
      baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
    });
  }
  return authClient;
}

interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface SessionState {
  data: Session | null;
  isPending: boolean;
  error: Error | null;
}

// SSR-safe useSession hook
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    const client = getAuthClient();
    if (!client) return;

    // Get initial session
    client.getSession().then((result) => {
      if ('error' in result && result.error) {
        setState({
          data: null,
          isPending: false,
          error: new Error(result.error.message || 'Session error'),
        });
      } else if ('data' in result) {
        setState({
          data: result.data as Session | null,
          isPending: false,
          error: null,
        });
      }
    });
  }, []);

  return state;
}

// Auth methods that work on client-side only
export const signIn = {
  email: async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const client = getAuthClient();
    if (!client) return { error: { message: 'Client not initialized' } };
    return client.signIn.email(data);
  },
};

export const signUp = {
  email: async (data: { name: string; email: string; password: string }) => {
    const client = getAuthClient();
    if (!client) return { error: { message: 'Client not initialized' } };
    return client.signUp.email(data);
  },
};

export async function signOut() {
  const client = getAuthClient();
  if (!client) return;
  return client.signOut();
}

export async function getSession() {
  const client = getAuthClient();
  if (!client) return { data: null, error: null };
  return client.getSession();
}
