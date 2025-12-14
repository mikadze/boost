'use client';

import { useState, useCallback, useRef } from 'react';
import type { GeneratedRule, GenerateRuleRequest } from '@/lib/ai/rule-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface UseAIRuleGeneratorState {
  isGenerating: boolean;
  partialContent: string;
  rule: GeneratedRule | null;
  error: string | null;
}

interface UseAIRuleGeneratorReturn extends UseAIRuleGeneratorState {
  generate: (request: GenerateRuleRequest) => Promise<GeneratedRule | null>;
  reset: () => void;
  cancel: () => void;
}

export function useAIRuleGenerator(): UseAIRuleGeneratorReturn {
  const [state, setState] = useState<UseAIRuleGeneratorState>({
    isGenerating: false,
    partialContent: '',
    rule: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      partialContent: '',
      rule: null,
      error: null,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }, []);

  const generate = useCallback(async (request: GenerateRuleRequest): Promise<GeneratedRule | null> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState({
      isGenerating: true,
      partialContent: '',
      rule: null,
      error: null,
    });

    try {
      const response = await fetch(`${API_URL}/ai/generate-rule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const generatedRule = data.rule as GeneratedRule;

      setState(prev => ({
        ...prev,
        isGenerating: false,
        rule: generatedRule,
      }));

      return generatedRule;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate rule';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      return null;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  return {
    ...state,
    generate,
    reset,
    cancel,
  };
}
