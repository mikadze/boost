'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  Target,
  ListChecks,
  Trash2,
  Loader2,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface QuestStep {
  id: string;
  title: string;
  description: string;
  eventName: string;
  requiredCount: number;
  orderIndex: number;
}

export default function NewQuestPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [rewardXp, setRewardXp] = React.useState(100);
  const [steps, setSteps] = React.useState<QuestStep[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleCreate = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push('/dashboard/quests');
  };

  const handleAddStep = () => {
    const newStep: QuestStep = {
      id: `s${Date.now()}`,
      title: '',
      description: '',
      eventName: '',
      requiredCount: 1,
      orderIndex: steps.length,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<QuestStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/quests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Quest</h1>
            <p className="text-muted-foreground">
              Define a new gamified quest for your users
            </p>
          </div>
        </div>
        <GlowButton
          variant="glow"
          onClick={handleCreate}
          disabled={isSaving || !name.trim()}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Create Quest
        </GlowButton>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quest Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quest Details
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome Journey"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this quest is about..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardXp">Reward XP</Label>
                <Input
                  id="rewardXp"
                  type="number"
                  value={rewardXp}
                  onChange={(e) => setRewardXp(parseInt(e.target.value) || 0)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  XP awarded when user completes all steps
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Quest Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <GlassCard>
            <GlassCardHeader className="flex-row items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                Quest Steps ({steps.length})
              </GlassCardTitle>
              <Button size="sm" onClick={handleAddStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3 p-4 rounded-lg bg-surface-1 border border-border"
                  >
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Title *</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                          placeholder="Step title"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Event Name *</Label>
                        <Input
                          value={step.eventName}
                          onChange={(e) => handleUpdateStep(step.id, { eventName: e.target.value })}
                          placeholder="e.g., user_signup"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Input
                          value={step.description}
                          onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                          placeholder="Step description"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Required Count</Label>
                        <Input
                          type="number"
                          value={step.requiredCount}
                          onChange={(e) =>
                            handleUpdateStep(step.id, { requiredCount: parseInt(e.target.value) || 1 })
                          }
                          min={1}
                        />
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {steps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No steps yet. Add your first step to get started.</p>
                    <Button className="mt-4" onClick={handleAddStep}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Step
                    </Button>
                  </div>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
