'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Trash2,
  Filter,
  Download,
  ChevronRight,
  Clock,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/hooks/use-organization';

interface EventLog {
  id: string;
  eventType: string;
  userId: string | null;
  status: 'pending' | 'processed' | 'failed';
  payload: Record<string, unknown>;
  errorDetails: string | null;
  createdAt: string;
  processedAt: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function DebuggerPage() {
  const { projects } = useOrganization();
  const currentProject = projects[0];
  const projectId = currentProject?.id;

  const [isLive, setIsLive] = React.useState(true);
  const [selectedLog, setSelectedLog] = React.useState<EventLog | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [logs, setLogs] = React.useState<EventLog[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // Connect to SSE for real-time events
  React.useEffect(() => {
    if (!projectId || !isLive) {
      return;
    }

    const connectSSE = () => {
      const url = `${API_URL}/dashboard/projects/${projectId}/events/stream`;
      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error('SSE error:', data.error);
            return;
          }

          if (data.isInitial) {
            // Replace all logs on initial load
            setLogs(data.events);
          } else if (data.events.length > 0) {
            // Prepend new events
            setLogs((prev) => {
              const newEvents = data.events.filter(
                (e: EventLog) => !prev.some((p) => p.id === e.id)
              );
              return [...newEvents, ...prev].slice(0, 100); // Keep max 100 events
            });
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [projectId, isLive]);

  // Fallback: fetch initial events if SSE fails
  React.useEffect(() => {
    if (!projectId) return;

    const fetchInitialEvents = async () => {
      try {
        const response = await fetch(
          `${API_URL}/dashboard/projects/${projectId}/events?limit=50`,
          { credentials: 'include' }
        );
        if (response.ok) {
          const events = await response.json();
          setLogs(events);
        }
      } catch (err) {
        console.error('Failed to fetch initial events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialEvents();
  }, [projectId]);

  const filteredLogs = logs.filter(
    (log) =>
      log.eventType.toLowerCase().includes(filterText.toLowerCase()) ||
      log.userId?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.status.toLowerCase().includes(filterText.toLowerCase())
  );

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'processed':
        return 'active';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'inactive';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.startsWith('page_')) return 'text-green-400';
    if (eventType.startsWith('user_')) return 'text-blue-400';
    if (eventType.startsWith('purchase') || eventType.includes('payment')) return 'text-purple-400';
    if (eventType.includes('error') || eventType.includes('fail')) return 'text-red-400';
    return 'text-yellow-400';
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium">No Project Selected</h2>
          <p className="text-muted-foreground">Please create a project first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Event Debugger</h1>
          <p className="text-muted-foreground">
            Monitor and debug events in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isLive ? 'default' : 'outline'}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" onClick={clearLogs}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Live indicator */}
      {isLive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2 text-sm',
            isConnected ? 'text-green-400' : 'text-yellow-400'
          )}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live - Streaming events
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          )}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-280px)]">
        {/* Event list */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by event type, user ID, or status..."
                  className="pl-9 bg-surface-1"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No events yet</p>
                  <p className="text-xs">Events will appear here when they are received</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        selectedLog?.id === log.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-surface-1'
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-xs font-medium truncate max-w-[120px]',
                          getEventTypeColor(log.eventType)
                        )}
                      >
                        {log.eventType}
                      </span>
                      <span className="flex-1 text-sm truncate text-muted-foreground">
                        {log.userId || 'anonymous'}
                      </span>
                      <StatusBadge
                        variant={getStatusVariant(log.status)}
                        size="sm"
                      >
                        {log.status}
                      </StatusBadge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </GlassCard>
        </motion.div>

        {/* Event detail */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="h-full flex flex-col">
            {selectedLog ? (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'font-mono text-sm font-medium',
                        getEventTypeColor(selectedLog.eventType)
                      )}
                    >
                      {selectedLog.eventType}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <StatusBadge variant={getStatusVariant(selectedLog.status)}>
                      {selectedLog.status === 'processed' ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : selectedLog.status === 'pending' ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {selectedLog.status}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                    {selectedLog.userId && (
                      <span>User: {selectedLog.userId}</span>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="payload" className="flex-1 flex flex-col">
                  <TabsList className="mx-4 mt-4">
                    <TabsTrigger value="payload">Payload</TabsTrigger>
                    <TabsTrigger value="meta">Metadata</TabsTrigger>
                    {selectedLog.errorDetails && (
                      <TabsTrigger value="error">Error</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="payload" className="flex-1 p-4 pt-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Event Payload
                          </h4>
                          <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="meta" className="flex-1 p-4 pt-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Event Details
                          </h4>
                          <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                            {JSON.stringify(
                              {
                                id: selectedLog.id,
                                eventType: selectedLog.eventType,
                                userId: selectedLog.userId,
                                status: selectedLog.status,
                                createdAt: selectedLog.createdAt,
                                processedAt: selectedLog.processedAt,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {selectedLog.errorDetails && (
                    <TabsContent value="error" className="flex-1 p-4 pt-0">
                      <ScrollArea className="h-full">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">
                              Error Details
                            </h4>
                            <pre className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs overflow-x-auto text-red-400">
                              {selectedLog.errorDetails}
                            </pre>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  )}
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select an event to view details
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
