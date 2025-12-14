'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Filter, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TriggerSelector } from './trigger-selector';
import { ConditionBuilder } from './condition-builder';
import { EffectBuilder } from './effect-builder';
import type { GeneratedRule, RuleCondition, RuleEffect } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface ScratchBuilderProps {
  onComplete: (rule: GeneratedRule) => void;
}

type BuilderStep = 'trigger' | 'conditions' | 'effects' | 'name';

const STEPS: { id: BuilderStep; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'trigger', title: 'When', icon: <Zap className="h-5 w-5" />, color: 'amber' },
  { id: 'conditions', title: 'If', icon: <Filter className="h-5 w-5" />, color: 'blue' },
  { id: 'effects', title: 'Then', icon: <Gift className="h-5 w-5" />, color: 'green' },
  { id: 'name', title: 'Name', icon: <ChevronRight className="h-5 w-5" />, color: 'violet' },
];

export function ScratchBuilder({ onComplete }: ScratchBuilderProps) {
  const [currentStep, setCurrentStep] = useState<BuilderStep>('trigger');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [conditionLogic, setConditionLogic] = useState<'and' | 'or'>('and');
  const [effects, setEffects] = useState<RuleEffect[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleTriggerSave = useCallback((events: string[]) => {
    setEventTypes(events);
    setCurrentStep('conditions');
  }, []);

  const handleConditionsSave = useCallback((conds: RuleCondition[], logic: 'and' | 'or') => {
    setConditions(conds);
    setConditionLogic(logic);
    setCurrentStep('effects');
  }, []);

  const handleEffectsSave = useCallback((effs: RuleEffect[]) => {
    setEffects(effs);
    setCurrentStep('name');
  }, []);

  const handleComplete = useCallback(() => {
    if (!name.trim() || eventTypes.length === 0 || effects.length === 0) return;

    const rule: GeneratedRule = {
      name: name.trim(),
      description: description.trim() || undefined,
      eventTypes,
      conditions: {
        logic: conditionLogic,
        conditions,
      },
      effects,
    };

    onComplete(rule);
  }, [name, description, eventTypes, conditions, conditionLogic, effects, onComplete]);

  const goBack = useCallback(() => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    const prevStep = STEPS[idx - 1];
    if (idx > 0 && prevStep) {
      setCurrentStep(prevStep.id);
    }
  }, [currentStep]);

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-2">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => {
                // Allow going back to completed steps
                if (index < currentStepIndex) {
                  setCurrentStep(step.id);
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                currentStepIndex === index
                  ? `bg-${step.color}-500 text-white`
                  : currentStepIndex > index
                  ? `bg-${step.color}-500/20 text-${step.color}-500 cursor-pointer hover:bg-${step.color}-500/30`
                  : 'bg-surface-2 text-muted-foreground'
              )}
              disabled={index > currentStepIndex}
            >
              {step.icon}
              <span className="text-sm font-medium">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 transition-colors',
                  currentStepIndex > index ? `bg-${STEPS[index + 1]?.color ?? 'primary'}-500` : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="min-h-[300px]"
      >
        {currentStep === 'trigger' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">When should this automation run?</h3>
              <p className="text-sm text-muted-foreground">
                Select one or more events that will trigger this automation
              </p>
            </div>
            <TriggerSelector
              selectedEvents={eventTypes}
              onSave={handleTriggerSave}
              onCancel={() => {}}
            />
          </div>
        )}

        {currentStep === 'conditions' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Add conditions (optional)</h3>
              <p className="text-sm text-muted-foreground">
                Filter when the automation runs based on specific criteria
              </p>
            </div>
            <ConditionBuilder
              conditions={conditions}
              logic={conditionLogic}
              onSave={handleConditionsSave}
              onCancel={goBack}
            />
          </div>
        )}

        {currentStep === 'effects' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">What should happen?</h3>
              <p className="text-sm text-muted-foreground">
                Choose the actions to take when the automation triggers
              </p>
            </div>
            <EffectBuilder
              effects={effects}
              onSave={handleEffectsSave}
              onCancel={goBack}
            />
          </div>
        )}

        {currentStep === 'name' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Name your automation</h3>
              <p className="text-sm text-muted-foreground">
                Give it a descriptive name so you can find it later
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., High Spender Rewards"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Award points to customers who spend over $100"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={goBack} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!name.trim()}
                className="flex-1"
              >
                Create Automation
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
