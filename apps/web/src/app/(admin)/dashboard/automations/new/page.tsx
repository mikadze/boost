'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import {
  CreationModeSelector,
  NaturalLanguageInput,
  TemplateGallery,
  ScratchBuilder,
  RulePreview,
} from '@/components/automation-wizard';
import { useOrganization } from '@/hooks/use-organization';
import type { GeneratedRule } from '@/lib/ai/rule-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type CreationMode = 'ai' | 'template' | 'scratch' | null;
type WizardStep = 'select-mode' | 'create' | 'preview' | 'confirm';

export default function NewAutomationPage() {
  const router = useRouter();
  const { projects, isLoading: orgLoading } = useOrganization();
  const projectId = projects[0]?.id;

  const [mode, setMode] = useState<CreationMode>(null);
  const [step, setStep] = useState<WizardStep>('select-mode');
  const [rule, setRule] = useState<GeneratedRule | null>(null);
  const [automationName, setAutomationName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeSelect = useCallback((selectedMode: CreationMode) => {
    setMode(selectedMode);
    setStep('create');
  }, []);

  const handleAiGenerate = useCallback((generatedRule: GeneratedRule) => {
    setRule(generatedRule);
    setAutomationName(generatedRule.name);
    setStep('preview');
  }, []);

  const handleTemplateSelect = useCallback((selectedRule: GeneratedRule) => {
    setRule(selectedRule);
    setAutomationName(selectedRule.name);
    setStep('preview');
  }, []);

  const handleScratchComplete = useCallback((builtRule: GeneratedRule) => {
    setRule(builtRule);
    setAutomationName(builtRule.name);
    setStep('preview');
  }, []);

  const handleRuleUpdate = useCallback((updatedRule: GeneratedRule) => {
    setRule(updatedRule);
  }, []);

  const handleConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleCreate = useCallback(async () => {
    if (!rule || !automationName.trim() || !projectId) return;

    setIsCreating(true);
    setError(null);
    try {
      // Create campaign via dashboard endpoint
      const campaignResponse = await fetch(
        `${API_URL}/dashboard/projects/${projectId}/campaigns`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: automationName.trim(),
            description: rule.description,
          }),
        }
      );

      if (!campaignResponse.ok) {
        throw new Error('Failed to create campaign');
      }

      const campaign = await campaignResponse.json();

      // Create rule in campaign
      const ruleResponse = await fetch(
        `${API_URL}/dashboard/projects/${projectId}/campaigns/${campaign.id}/rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: rule.name,
            description: rule.description,
            active: true,
            eventTypes: rule.eventTypes,
            conditions: rule.conditions,
            effects: rule.effects,
          }),
        }
      );

      if (!ruleResponse.ok) {
        throw new Error('Failed to create rule');
      }

      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (err) {
      console.error('Failed to create automation:', err);
      setError('Failed to create automation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [rule, automationName, router, projectId]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('preview');
    } else if (step === 'preview') {
      setStep('create');
    } else if (step === 'create') {
      setMode(null);
      setStep('select-mode');
      setRule(null);
    } else {
      router.back();
    }
  }, [step, router]);

  const handleCancel = useCallback(() => {
    router.push('/dashboard/campaigns');
  }, [router]);

  // Loading state
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No project available
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No project found. Please create a project first.</p>
        <Button onClick={() => router.push('/dashboard/developer/projects')}>
          Go to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Create New Automation</h1>
          </div>
          <p className="text-muted-foreground">
            {step === 'select-mode' && 'Choose how you want to create your automation'}
            {step === 'create' && mode === 'ai' && 'Describe what you want in plain English'}
            {step === 'create' && mode === 'template' && 'Pick a pre-built template'}
            {step === 'create' && mode === 'scratch' && 'Build your rule step by step'}
            {step === 'preview' && 'Review and customize your automation'}
            {step === 'confirm' && 'Give your automation a name'}
          </p>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {['select-mode', 'create', 'preview', 'confirm'].map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                step === s
                  ? 'bg-primary'
                  : ['select-mode', 'create', 'preview', 'confirm'].indexOf(step) > i
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
            {i < 3 && (
              <div
                className={`w-12 h-0.5 transition-colors ${
                  ['select-mode', 'create', 'preview', 'confirm'].indexOf(step) > i
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 'select-mode' && (
          <motion.div
            key="select-mode"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CreationModeSelector onSelect={handleModeSelect} />
          </motion.div>
        )}

        {step === 'create' && mode === 'ai' && (
          <motion.div
            key="ai-create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-6">
              <NaturalLanguageInput onRuleGenerated={handleAiGenerate} />
            </GlassCard>
          </motion.div>
        )}

        {step === 'create' && mode === 'template' && (
          <motion.div
            key="template-create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-6">
              <TemplateGallery onSelect={handleTemplateSelect} />
            </GlassCard>
          </motion.div>
        )}

        {step === 'create' && mode === 'scratch' && (
          <motion.div
            key="scratch-create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-6">
              <ScratchBuilder onComplete={handleScratchComplete} />
            </GlassCard>
          </motion.div>
        )}

        {step === 'preview' && rule && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <RulePreview
                rule={rule}
                onUpdate={handleRuleUpdate}
                editable
              />
            </GlassCard>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleConfirm}>
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && rule && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GlassCard className="p-6 space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Almost done!</h3>
                <p className="text-sm text-muted-foreground">
                  Give your automation a name to identify it later
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Automation Name</Label>
                  <Input
                    id="automation-name"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                    placeholder="e.g., High Spender Rewards"
                    autoFocus
                  />
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-surface-1 space-y-2">
                  <p className="text-sm font-medium">Summary</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Triggers:</span>{' '}
                      {rule.eventTypes.join(', ')}
                    </p>
                    <p>
                      <span className="font-medium">Conditions:</span>{' '}
                      {rule.conditions.conditions.length} rule(s)
                    </p>
                    <p>
                      <span className="font-medium">Effects:</span>{' '}
                      {rule.effects.map((e) => e.type).join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!automationName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Automation'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
