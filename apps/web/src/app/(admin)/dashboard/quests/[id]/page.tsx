'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  GripVertical,
  Target,
  ListChecks,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuestStep {
  id: string;
  title: string;
  description: string;
  eventName: string;
  requiredCount: number;
  orderIndex: number;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  rewardXp: number;
  steps: QuestStep[];
}

// Mock data
const mockQuest: Quest = {
  id: '1',
  name: 'Welcome Journey',
  description: 'Complete your profile and explore the platform',
  status: 'active',
  rewardXp: 500,
  steps: [
    {
      id: 's1',
      title: 'Create Account',
      description: 'Sign up for a new account',
      eventName: 'user_signup',
      requiredCount: 1,
      orderIndex: 0,
    },
    {
      id: 's2',
      title: 'Complete Profile',
      description: 'Fill in your profile details',
      eventName: 'profile_completed',
      requiredCount: 1,
      orderIndex: 1,
    },
    {
      id: 's3',
      title: 'Browse Products',
      description: 'View at least 5 products',
      eventName: 'product_viewed',
      requiredCount: 5,
      orderIndex: 2,
    },
    {
      id: 's4',
      title: 'Add to Cart',
      description: 'Add an item to your cart',
      eventName: 'add_to_cart',
      requiredCount: 1,
      orderIndex: 3,
    },
    {
      id: 's5',
      title: 'Make a Purchase',
      description: 'Complete your first purchase',
      eventName: 'purchase',
      requiredCount: 1,
      orderIndex: 4,
    },
  ],
};

export default function QuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quest, setQuest] = React.useState<Quest>(mockQuest);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setQuest((q) => ({ ...q, status: q.status === 'active' ? 'draft' : 'active' }));
    setIsPublishing(false);
  };

  const handleAddStep = () => {
    const newStep: QuestStep = {
      id: `s${Date.now()}`,
      title: 'New Step',
      description: '',
      eventName: '',
      requiredCount: 1,
      orderIndex: quest.steps.length,
    };
    setQuest((q) => ({ ...q, steps: [...q.steps, newStep] }));
  };

  const handleUpdateStep = (stepId: string, updates: Partial<QuestStep>) => {
    setQuest((q) => ({
      ...q,
      steps: q.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  const handleDeleteStep = (stepId: string) => {
    setQuest((q) => ({
      ...q,
      steps: q.steps.filter((s) => s.id !== stepId),
    }));
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{quest.name}</h1>
              <StatusBadge
                variant={quest.status === 'active' ? 'active' : quest.status === 'draft' ? 'warning' : 'inactive'}
                dot
                pulse={quest.status === 'active'}
              >
                {quest.status.charAt(0).toUpperCase() + quest.status.slice(1)}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground">Quest ID: {params.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : quest.status === 'active' ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {quest.status === 'active' ? 'Unpublish' : 'Publish'}
          </Button>
          <GlowButton variant="glow" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </GlowButton>
        </div>
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={quest.name}
                  onChange={(e) => setQuest((q) => ({ ...q, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quest.description}
                  onChange={(e) => setQuest((q) => ({ ...q, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardXp">Reward XP</Label>
                <Input
                  id="rewardXp"
                  type="number"
                  value={quest.rewardXp}
                  onChange={(e) => setQuest((q) => ({ ...q, rewardXp: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Quest
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Quest</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this quest? This action cannot be undone.
                        All user progress will be lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => router.push('/dashboard/quests')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                Quest Steps ({quest.steps.length})
              </GlassCardTitle>
              <Button size="sm" onClick={handleAddStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {quest.steps.map((step, index) => (
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
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                          placeholder="Step title"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Event Name</Label>
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

                {quest.steps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No steps yet. Add your first step to get started.</p>
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
