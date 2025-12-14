'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAIRuleGenerator } from '@/hooks/use-ai-rule-generator';
import type { GeneratedRule } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface NaturalLanguageInputProps {
  campaignName?: string;
  onRuleGenerated: (rule: GeneratedRule) => void;
}

const SUGGESTIONS = [
  'Give 500 points when someone spends over $100',
  '10% discount for gold members',
  'Welcome bonus of 100 points for new signups',
  'Upgrade to silver tier after 10 purchases',
  'Free shipping on orders over $75',
];

export function NaturalLanguageInput({
  campaignName,
  onRuleGenerated,
}: NaturalLanguageInputProps) {
  const [prompt, setPrompt] = useState('');
  const { isGenerating, partialContent, error, generate, reset } = useAIRuleGenerator();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    const result = await generate({
      prompt: prompt.trim(),
      context: campaignName ? { campaignName } : undefined,
    });

    if (result) {
      onRuleGenerated(result);
    }
  }, [prompt, campaignName, generate, onRuleGenerated]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
    reset();
  }, [reset]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) reset();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe your automation in plain English...

Example: 'Give 500 points when someone spends over $100'"
          className="min-h-[120px] pr-12 resize-none"
          disabled={isGenerating}
        />
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 rounded bg-surface-2 text-xs">Cmd</kbd> +{' '}
        <kbd className="px-1 py-0.5 rounded bg-surface-2 text-xs">Enter</kbd> to generate
      </p>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Streaming preview */}
      {isGenerating && partialContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-surface-2 border border-border"
        >
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating rule...
          </div>
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap overflow-hidden">
            {partialContent}
            <span className="animate-pulse">|</span>
          </pre>
        </motion.div>
      )}

      {/* Suggestions */}
      {!isGenerating && !partialContent && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs transition-colors',
                  'bg-surface-2 hover:bg-surface-3 text-foreground/80',
                  'border border-transparent hover:border-primary/30'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
