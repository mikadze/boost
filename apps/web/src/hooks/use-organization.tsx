'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  projectId: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface OrganizationContextValue {
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  isLoading: boolean;
  createOrganization: (name: string) => Promise<Organization>;
  projects: Project[];
  createProject: (name: string) => Promise<Project>;
  apiKeys: ApiKey[];
  createApiKey: (projectId: string, name: string) => Promise<{ key: ApiKey; secret: string }>;
  revokeApiKey: (keyId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => fetchApi<Organization[]>('/organizations'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', currentOrg?.id],
    queryFn: () => fetchApi<Project[]>(`/organizations/${currentOrg?.id}/projects`),
    enabled: !!currentOrg,
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const allKeys: ApiKey[] = [];
      for (const project of projects) {
        const keys = await fetchApi<ApiKey[]>(`/projects/${project.id}/api-keys`);
        allKeys.push(...keys);
      }
      return allKeys;
    },
    enabled: !!currentOrg && projects.length > 0,
  });

  useEffect(() => {
    if (organizations.length > 0 && !currentOrg) {
      const saved = localStorage.getItem('currentOrgId');
      const org = saved
        ? organizations.find((o) => o.id === saved) ?? organizations[0]
        : organizations[0];
      if (org) setCurrentOrgState(org);
    }
  }, [organizations, currentOrg]);

  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem('currentOrgId', org.id);
  }, []);

  const createOrgMutation = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (newOrg) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setCurrentOrg(newOrg);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Project>(`/organizations/${currentOrg?.id}/projects`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', currentOrg?.id] });
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      fetchApi<{ key: ApiKey; secret: string }>(`/projects/${projectId}/api-keys`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', currentOrg?.id] });
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: (keyId: string) =>
      fetchApi<void>(`/api-keys/${keyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys', currentOrg?.id] });
    },
  });

  const value = useMemo<OrganizationContextValue>(() => ({
    organizations,
    currentOrg,
    setCurrentOrg,
    isLoading: orgsLoading,
    createOrganization: (name: string) => createOrgMutation.mutateAsync(name),
    projects,
    createProject: (name: string) => createProjectMutation.mutateAsync(name),
    apiKeys,
    createApiKey: (projectId: string, name: string) =>
      createApiKeyMutation.mutateAsync({ projectId, name }),
    revokeApiKey: (keyId: string) => revokeApiKeyMutation.mutateAsync(keyId),
  }), [
    organizations,
    currentOrg,
    setCurrentOrg,
    orgsLoading,
    createOrgMutation,
    projects,
    createProjectMutation,
    apiKeys,
    createApiKeyMutation,
    revokeApiKeyMutation,
  ]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
