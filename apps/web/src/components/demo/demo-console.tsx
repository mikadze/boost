'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDemoContext, type LogEntry } from './demo-provider';

function LogEntryItem({ log }: { log: LogEntry }) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(log.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgColor = {
    request: 'bg-blue-500/10 border-blue-500/20',
    response: 'bg-green-500/10 border-green-500/20',
    event: 'bg-purple-500/10 border-purple-500/20',
    error: 'bg-red-500/10 border-red-500/20',
  }[log.type];

  const badgeColor = {
    request: 'bg-blue-500/20 text-blue-400',
    response: 'bg-green-500/20 text-green-400',
    event: 'bg-purple-500/20 text-purple-400',
    error: 'bg-red-500/20 text-red-400',
  }[log.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`p-3 rounded-lg border ${bgColor}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
          {log.type.toUpperCase()}
        </span>
        {log.method && (
          <span className="text-xs text-muted-foreground font-mono">
            {log.method}
          </span>
        )}
        {log.endpoint && (
          <span className="text-xs text-muted-foreground">
            {log.endpoint}
          </span>
        )}
        {log.duration !== undefined && (
          <span className="text-xs text-muted-foreground">
            {log.duration}ms
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap text-xs font-mono">
        {JSON.stringify(log.data, null, 2)}
      </pre>
    </motion.div>
  );
}

export function DemoConsole() {
  const { logs, clearLogs } = useDemoContext();

  return (
    <GlassCard className="h-full flex flex-col">
      <GlassCardHeader className="flex-row items-center justify-between flex-shrink-0">
        <GlassCardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Live Console
        </GlassCardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          disabled={logs.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </GlassCardHeader>
      <GlassCardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-2 font-mono text-xs pr-4">
            <AnimatePresence>
              {logs.map((log) => (
                <LogEntryItem key={log.id} log={log} />
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Interact with the demo to see SDK calls here
              </p>
            )}
          </div>
        </ScrollArea>
      </GlassCardContent>
    </GlassCard>
  );
}
