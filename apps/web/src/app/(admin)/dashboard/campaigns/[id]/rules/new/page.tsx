'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardContainer } from '@/components/automation-wizard';
import type { GeneratedRule } from '@/lib/ai/rule-types';

// TODO: Replace with actual API call
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Mock campaign data - TODO: Fetch from API
const getMockCampaign = (id: string) => ({
  id,
  name: 'Summer Sale 2024',
  description: 'Big discounts on summer items',
});

export default function NewRulePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  // TODO: Replace with actual API fetch
  const campaign = getMockCampaign(campaignId);

  const handleSave = async (rule: GeneratedRule) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: rule.name,
          description: rule.description,
          active: true,
          eventTypes: rule.eventTypes,
          conditions: rule.conditions,
          effects: rule.effects,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create rule');
      }

      // Navigate back to campaign detail page
      router.push(`/dashboard/campaigns/${campaignId}`);
    } catch (error) {
      console.error('Failed to save rule:', error);
      // For now, just navigate back (remove when API is connected)
      router.push(`/dashboard/campaigns/${campaignId}`);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Create Automation Rule</h1>
          </div>
          <p className="text-muted-foreground">
            for {campaign.name}
          </p>
        </div>
      </motion.div>

      {/* Wizard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WizardContainer
          campaignId={campaignId}
          campaignName={campaign.name}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </motion.div>
    </div>
  );
}
