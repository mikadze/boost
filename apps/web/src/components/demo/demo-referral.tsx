'use client';

import * as React from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddLog } from './demo-provider';
import { DemoCodeToggle } from './sdk-code-snippet';
import { SDK_SNIPPETS } from './sdk-snippets';

// Mock referral codes per demo user
const demoReferralCodes: Record<string, string> = {
  demo_bronze: 'ALEX2024',
  demo_silver: 'SAMREF',
  demo_gold: 'JORDAN_VIP',
  demo_new: 'NEWBIE123',
};

interface DemoReferralProps {
  userId: string;
}

export function DemoReferral({ userId }: DemoReferralProps) {
  const addLog = useAddLog();
  const [copied, setCopied] = React.useState(false);

  const userReferralCode = demoReferralCodes[userId] ?? 'DEMO123';
  const referralLink = `https://example.com/?ref=${userReferralCode}`;

  const handleCopyLink = async () => {
    addLog({
      type: 'event',
      method: 'copy',
      data: { referralLink, referralCode: userReferralCode },
    });

    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DemoCodeToggle {...SDK_SNIPPETS.referral}>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Referral Link
          </GlassCardTitle>
        </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Your Referral Link */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Your unique referral link:</p>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Code: <span className="font-mono font-medium">{userReferralCode}</span>
          </p>
        </div>
      </GlassCardContent>
      </GlassCard>
    </DemoCodeToggle>
  );
}
