'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, LayoutGrid, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CreationMode = 'ai' | 'template' | 'scratch';

interface CreationModeSelectorProps {
  selectedMode?: CreationMode | null;
  onSelect: (mode: CreationMode) => void;
}

const MODES: {
  id: CreationMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'ai',
    title: 'Create with AI',
    description: 'Describe your automation in plain English and let AI build it for you',
    icon: <Sparkles className="h-8 w-8" />,
    color: 'violet',
  },
  {
    id: 'template',
    title: 'Choose a Template',
    description: 'Start from a pre-built strategy and customize it to your needs',
    icon: <LayoutGrid className="h-8 w-8" />,
    color: 'blue',
  },
  {
    id: 'scratch',
    title: 'Start from Scratch',
    description: 'Build your automation step by step with full control',
    icon: <Wrench className="h-8 w-8" />,
    color: 'emerald',
  },
];

export function CreationModeSelector({ selectedMode, onSelect }: CreationModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {MODES.map((mode, index) => {
        const isSelected = selectedMode === mode.id;

        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(mode.id)}
            className={cn(
              'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
              'hover:scale-[1.02] hover:shadow-lg',
              isSelected
                ? `border-${mode.color}-500 bg-${mode.color}-500/10 shadow-lg shadow-${mode.color}-500/20`
                : 'border-border bg-surface-1 hover:border-primary/50'
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                layoutId="selectedIndicator"
                className={cn(
                  'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
                  `bg-${mode.color}-500 text-white`
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* Icon */}
            <div
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors',
                isSelected
                  ? `bg-${mode.color}-500/20 text-${mode.color}-500`
                  : 'bg-surface-2 text-muted-foreground'
              )}
            >
              {mode.icon}
            </div>

            {/* Content */}
            <h3
              className={cn(
                'text-lg font-semibold mb-2 transition-colors',
                isSelected ? `text-${mode.color}-500` : 'text-foreground'
              )}
            >
              {mode.title}
            </h3>
            <p className="text-sm text-muted-foreground">{mode.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
