'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { NaturalLanguageInput } from './natural-language-input';
import { RulePreview } from './rule-preview';
import { TemplateGallery } from './template-gallery';
import type { GeneratedRule } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

type WizardStep = 'input' | 'preview' | 'confirm';

interface WizardContainerProps {
  campaignId: string;
  campaignName?: string;
  onSave: (rule: GeneratedRule) => Promise<void>;
  onCancel: () => void;
}

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'input', label: 'Describe', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'preview', label: 'Preview', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'confirm', label: 'Confirm', icon: <Check className="h-4 w-4" /> },
];

export function WizardContainer({
  campaignId,
  campaignName,
  onSave,
  onCancel,
}: WizardContainerProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('input');
  const [rule, setRule] = useState<GeneratedRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const handleRuleGenerated = useCallback((generatedRule: GeneratedRule) => {
    setRule(generatedRule);
    setCurrentStep('preview');
  }, []);

  const handleTemplateSelect = useCallback((templateRule: GeneratedRule) => {
    setRule(templateRule);
    setCurrentStep('preview');
  }, []);

  const handleRuleUpdate = useCallback((updatedRule: GeneratedRule) => {
    setRule(updatedRule);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 'preview') {
      setCurrentStep('input');
    } else if (currentStep === 'confirm') {
      setCurrentStep('preview');
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep === 'preview' && rule) {
      setCurrentStep('confirm');
    }
  }, [currentStep, rule]);

  const handleSave = useCallback(async () => {
    if (!rule) return;

    setIsSaving(true);
    try {
      await onSave(rule);
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setIsSaving(false);
    }
  }, [rule, onSave]);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-full transition-colors',
                  currentStepIndex === index
                    ? 'bg-primary text-primary-foreground'
                    : currentStepIndex > index
                    ? 'bg-primary/20 text-primary'
                    : 'bg-surface-2 text-muted-foreground'
                )}
              >
                {step.icon}
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 transition-colors',
                    currentStepIndex > index ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 'input' && (
            <div className="space-y-6">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Describe Your Automation
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <NaturalLanguageInput
                    campaignName={campaignName}
                    onRuleGenerated={handleRuleGenerated}
                  />
                </GlassCardContent>
              </GlassCard>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or start from a template
                  </span>
                </div>
              </div>

              <TemplateGallery onSelect={handleTemplateSelect} />
            </div>
          )}

          {currentStep === 'preview' && rule && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Preview Your Rule
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <RulePreview
                  rule={rule}
                  onUpdate={handleRuleUpdate}
                  editable
                />
              </GlassCardContent>
            </GlassCard>
          )}

          {currentStep === 'confirm' && rule && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  Confirm Your Rule
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="rounded-lg bg-surface-2 p-4">
                  <h4 className="font-medium mb-2">{rule.name}</h4>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}
                </div>
                <RulePreview rule={rule} editable={false} />
              </GlassCardContent>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={currentStep === 'input' ? onCancel : handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'input' ? 'Cancel' : 'Back'}
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === 'preview' && (
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {currentStep === 'confirm' && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Rule'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
