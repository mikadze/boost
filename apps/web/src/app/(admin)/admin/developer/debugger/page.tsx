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
  ChevronDown,
  Clock,
  ArrowRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RequestLog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  duration: number;
  timestamp: string;
  request: {
    headers: Record<string, string>;
    body?: Record<string, unknown>;
  };
  response: {
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
}

const mockLogs: RequestLog[] = [
  {
    id: '1',
    method: 'POST',
    path: '/events/track',
    status: 202,
    duration: 42,
    timestamp: '2024-07-11T14:32:15.123Z',
    request: {
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'pk_live_***' },
      body: { event: 'page_view', userId: 'user_123', properties: { page: '/products' } },
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      body: { status: 'accepted', eventId: 'evt_abc123' },
    },
  },
  {
    id: '2',
    method: 'POST',
    path: '/events/track',
    status: 202,
    duration: 38,
    timestamp: '2024-07-11T14:32:10.456Z',
    request: {
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'pk_live_***' },
      body: { event: 'add_to_cart', userId: 'user_456', properties: { productId: 'prod_789', quantity: 2 } },
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      body: { status: 'accepted', eventId: 'evt_def456' },
    },
  },
  {
    id: '3',
    method: 'GET',
    path: '/sessions/sess_123',
    status: 200,
    duration: 25,
    timestamp: '2024-07-11T14:32:05.789Z',
    request: {
      headers: { 'x-api-key': 'pk_live_***' },
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      body: { id: 'sess_123', userId: 'user_123', items: [], total: 0 },
    },
  },
  {
    id: '4',
    method: 'POST',
    path: '/sessions/sess_123/apply-coupon',
    status: 400,
    duration: 35,
    timestamp: '2024-07-11T14:32:00.012Z',
    request: {
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'pk_live_***' },
      body: { code: 'INVALID123' },
    },
    response: {
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Invalid coupon code', code: 'COUPON_NOT_FOUND' },
    },
  },
];

const methodColors = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
};

export default function DebuggerPage() {
  const [isLive, setIsLive] = React.useState(true);
  const [selectedLog, setSelectedLog] = React.useState<RequestLog | null>(null);
  const [filterText, setFilterText] = React.useState('');
  const [logs, setLogs] = React.useState(mockLogs);

  const filteredLogs = logs.filter(
    (log) =>
      log.path.toLowerCase().includes(filterText.toLowerCase()) ||
      log.method.toLowerCase().includes(filterText.toLowerCase())
  );

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Request Debugger</h1>
          <p className="text-muted-foreground">
            Monitor and debug API requests in real-time
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
          className="flex items-center gap-2 text-sm text-green-400"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          Live - Streaming requests
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-280px)]">
        {/* Request list */}
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
                  placeholder="Filter requests..."
                  className="pl-9 bg-surface-1"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
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
                        'font-mono text-xs font-medium w-12',
                        methodColors[log.method]
                      )}
                    >
                      {log.method}
                    </span>
                    <span className="flex-1 text-sm truncate">{log.path}</span>
                    <StatusBadge
                      variant={
                        log.status < 300
                          ? 'active'
                          : log.status < 400
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                    >
                      {log.status}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {log.duration}ms
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </GlassCard>
        </motion.div>

        {/* Request detail */}
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
                        methodColors[selectedLog.method]
                      )}
                    >
                      {selectedLog.method}
                    </span>
                    <span className="font-mono text-sm">{selectedLog.path}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <StatusBadge
                      variant={
                        selectedLog.status < 300
                          ? 'active'
                          : selectedLog.status < 400
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {selectedLog.status < 300 ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : selectedLog.status < 400 ? (
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
                      {selectedLog.duration}ms
                    </span>
                    <span>
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Tabs defaultValue="request" className="flex-1 flex flex-col">
                  <TabsList className="mx-4 mt-4">
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request" className="flex-1 p-4 pt-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Headers
                          </h4>
                          <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.request.headers, null, 2)}
                          </pre>
                        </div>
                        {selectedLog.request.body && (
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                              Body
                            </h4>
                            <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                              {JSON.stringify(selectedLog.request.body, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="response" className="flex-1 p-4 pt-0">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Headers
                          </h4>
                          <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.response.headers, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Body
                          </h4>
                          <pre className="p-3 rounded-lg bg-surface-1 text-xs overflow-x-auto">
                            {JSON.stringify(selectedLog.response.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a request to view details
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
