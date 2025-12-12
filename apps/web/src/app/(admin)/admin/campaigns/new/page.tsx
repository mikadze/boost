'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  DollarSign,
  Settings,
  Sparkles,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const steps = [
  { id: 'basics', title: 'Campaign Basics', icon: Settings },
  { id: 'schedule', title: 'Schedule', icon: Calendar },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'review', title: 'Review', icon: Check },
];

const formSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(50),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.number().min(0).default(0),
  budgetType: z.enum(['unlimited', 'fixed']).default('unlimited'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      priority: 50,
      startDate: '',
      endDate: '',
      budget: 0,
      budgetType: 'unlimited',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: FormData) => {
    console.log('Creating campaign:', data);
    // TODO: Call API to create campaign
    router.push('/admin/campaigns');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Campaign</h1>
          <p className="text-muted-foreground">
            Set up a new promotional campaign
          </p>
        </div>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    index === currentStep
                      ? 'bg-primary/10 text-primary'
                      : index < currentStep
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                      index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStep
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-2 text-muted-foreground'
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      index < currentStep ? 'bg-primary' : 'bg-surface-2'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Step content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{steps[currentStep]?.title}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Summer Sale 2024"
                          className="bg-surface-1"
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your campaign..."
                          className="bg-surface-1"
                          {...register('description')}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-surface-1">
                        <div>
                          <Label>Active on creation</Label>
                          <p className="text-sm text-muted-foreground">
                            Campaign will be active immediately after creation
                          </p>
                        </div>
                        <Switch
                          checked={watchedValues.active}
                          onCheckedChange={(checked) =>
                            setValue('active', checked)
                          }
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Priority</Label>
                          <span className="text-sm font-mono text-muted-foreground">
                            {watchedValues.priority}
                          </span>
                        </div>
                        <Slider
                          value={[watchedValues.priority]}
                          onValueChange={([value]) => setValue('priority', value ?? 50)}
                          max={100}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher priority campaigns are evaluated first
                        </p>
                      </div>
                    </div>
                  )}

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            className="bg-surface-1"
                            {...register('startDate')}
                          />
                          {errors.startDate && (
                            <p className="text-sm text-destructive">
                              {errors.startDate.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            className="bg-surface-1"
                            {...register('endDate')}
                          />
                          {errors.endDate && (
                            <p className="text-sm text-destructive">
                              {errors.endDate.message}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The campaign will only be active between these dates
                      </p>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setValue('budgetType', 'unlimited')}
                          className={cn(
                            'p-4 rounded-lg border text-left transition-colors',
                            watchedValues.budgetType === 'unlimited'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Sparkles className="h-6 w-6 text-primary mb-2" />
                          <p className="font-medium">Unlimited</p>
                          <p className="text-sm text-muted-foreground">
                            No spending limit
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('budgetType', 'fixed')}
                          className={cn(
                            'p-4 rounded-lg border text-left transition-colors',
                            watchedValues.budgetType === 'fixed'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <DollarSign className="h-6 w-6 text-primary mb-2" />
                          <p className="font-medium">Fixed Budget</p>
                          <p className="text-sm text-muted-foreground">
                            Set a maximum spend
                          </p>
                        </button>
                      </div>
                      {watchedValues.budgetType === 'fixed' && (
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              id="budget"
                              type="number"
                              placeholder="0.00"
                              className="bg-surface-1 pl-7"
                              {...register('budget', { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="rounded-lg bg-surface-1 p-4 space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">
                            {watchedValues.name || 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-medium">
                            {watchedValues.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Priority</span>
                          <span className="font-medium font-mono">
                            {watchedValues.priority}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Schedule</span>
                          <span className="font-medium">
                            {watchedValues.startDate && watchedValues.endDate
                              ? `${new Date(
                                  watchedValues.startDate
                                ).toLocaleDateString()} - ${new Date(
                                  watchedValues.endDate
                                ).toLocaleDateString()}`
                              : 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget</span>
                          <span className="font-medium">
                            {watchedValues.budgetType === 'unlimited'
                              ? 'Unlimited'
                              : `$${watchedValues.budget.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        After creation, you can add rules to define how rewards
                        are distributed.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </GlassCardContent>

            {/* Navigation buttons */}
            <div className="flex justify-between p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {currentStep < steps.length - 1 ? (
                <GlowButton type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </GlowButton>
              ) : (
                <GlowButton type="submit" variant="glow">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Campaign
                </GlowButton>
              )}
            </div>
          </GlassCard>
        </form>
      </motion.div>
    </div>
  );
}
