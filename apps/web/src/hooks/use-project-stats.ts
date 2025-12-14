'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrganization } from './use-organization';

export interface ProjectStatsSummary {
  totalEvents: number;
  firstEventAt: string | null;
  activeCampaigns: number;
}

export interface RecentEvent {
  id: string;
  eventType: string;
  userId: string | null;
  status: string;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useProjectStats(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projectStats', projectId],
    queryFn: () => fetchApi<ProjectStatsSummary>(`/projects/${projectId}/stats/summary`),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
}

export function useRecentEvents(projectId: string | undefined, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: ['recentEvents', projectId],
    queryFn: () => fetchApi<RecentEvent[]>(`/projects/${projectId}/events/recent?limit=10`),
    enabled: !!projectId && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 5000, // 5 seconds
  });
}

export function useCurrentProjectStats() {
  const { projects } = useOrganization();
  const currentProject = projects[0];

  const stats = useProjectStats(currentProject?.id);
  const recentEvents = useRecentEvents(currentProject?.id);

  return {
    projectId: currentProject?.id,
    projectName: currentProject?.name,
    stats: stats.data,
    recentEvents: recentEvents.data,
    isLoading: stats.isLoading || recentEvents.isLoading,
    hasEvents: (stats.data?.totalEvents ?? 0) > 0,
    refetchStats: stats.refetch,
    refetchEvents: recentEvents.refetch,
  };
}
