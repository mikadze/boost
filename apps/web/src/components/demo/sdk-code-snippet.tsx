'use client';

import * as React from 'react';
import { Code, Monitor, Server, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';
import type { CodeExample } from './sdk-snippets';

interface DemoCodeToggleProps {
  children: React.ReactNode;
  featureName: string;
  frontend?: CodeExample[];
  backend?: CodeExample[];
}

export function DemoCodeToggle({ children, featureName, frontend, backend }: DemoCodeToggleProps) {
  const [showCode, setShowCode] = React.useState(false);
  const hasBoth = frontend && backend;
  const hasOnlyFrontend = frontend && !backend;

  if (!frontend && !backend) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? (
            <>
              <Eye className="h-4 w-4" />
              Demo
            </>
          ) : (
            <>
              <Code className="h-4 w-4" />
              Code
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {showCode ? (
        <div className="p-4 pt-14 rounded-lg glass border border-border min-h-[200px]">
          <h4 className="font-semibold text-sm mb-3">{featureName} SDK</h4>

          {hasBoth ? (
            <Tabs defaultValue="frontend">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="frontend" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Frontend
                </TabsTrigger>
                <TabsTrigger value="backend" className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Backend
                </TabsTrigger>
              </TabsList>
              <TabsContent value="frontend" className="space-y-4">
                {frontend.map((example, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-muted-foreground mb-2">{example.label}</p>
                    <CodeBlock code={example.code} language={example.language || 'tsx'} />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="backend" className="space-y-4">
                {backend.map((example, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-muted-foreground mb-2">{example.label}</p>
                    <CodeBlock code={example.code} language={example.language || 'tsx'} />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          ) : hasOnlyFrontend ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Monitor className="h-3 w-3" />
                <span>@gamify/react</span>
              </div>
              {frontend!.map((example, idx) => (
                <div key={idx}>
                  <p className="text-xs text-muted-foreground mb-2">{example.label}</p>
                  <CodeBlock code={example.code} language={example.language || 'tsx'} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Server className="h-3 w-3" />
                <span>@gamify/node</span>
              </div>
              {backend!.map((example, idx) => (
                <div key={idx}>
                  <p className="text-xs text-muted-foreground mb-2">{example.label}</p>
                  <CodeBlock code={example.code} language={example.language || 'tsx'} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// Keep the old component for backwards compatibility, but deprecated
/** @deprecated Use DemoCodeToggle instead */
export function SdkCodeSnippet(_props: {
  featureName: string;
  frontend?: CodeExample[];
  backend?: CodeExample[];
}) {
  return null;
}
