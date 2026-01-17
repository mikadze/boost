'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from './use-organization';

// Settings types matching the API
export interface ReferralSettings {
  enabled: boolean;
  referralLinkBase: string;
  cookieDuration: number;
  commissionTrigger: 'purchase' | 'signup' | 'subscription';
  minPayout: number;
  autoApprove: boolean;
}

export interface IncentiveSettings {
  type: 'percentage' | 'fixed' | 'points';
  value: number;
  description?: string;
}

export interface ProjectSettings {
  referral?: ReferralSettings;
  incentive?: IncentiveSettings;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useProjectSettings(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projectSettings', projectId],
    queryFn: () => fetchApi<ProjectSettings>(`/projects/${projectId}/settings`),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
}

export function useUpdateProjectSettings(projectId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<ProjectSettings>) =>
      fetchApi<ProjectSettings>(`/projects/${projectId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onSuccess: (data) => {
      // Update the cache with the new settings
      queryClient.setQueryData(['projectSettings', projectId], data);
    },
  });
}

export function useCurrentProjectSettings() {
  const { projects } = useOrganization();
  const currentProject = projects[0];

  const settings = useProjectSettings(currentProject?.id);
  const updateMutation = useUpdateProjectSettings(currentProject?.id);

  return {
    projectId: currentProject?.id,
    settings: settings.data,
    isLoading: settings.isLoading,
    error: settings.error,
    refetch: settings.refetch,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
