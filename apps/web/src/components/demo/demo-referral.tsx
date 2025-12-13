'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, Check, UserPlus, X, Loader2 } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAddLog } from './demo-provider';

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [referrerCode, setReferrerCode] = React.useState<string | null>(null);
  const [referrerInput, setReferrerInput] = React.useState('');

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

  const handleSetReferrer = async () => {
    if (!referrerInput.trim()) return;

    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'POST',
      endpoint: '/v1/referral/set',
      data: { userId, referrerCode: referrerInput },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    addLog({
      type: 'response',
      method: '200 OK',
      data: {
        success: true,
        referrerCode: referrerInput,
        detectedAt: new Date().toISOString(),
      },
    });

    setReferrerCode(referrerInput);
    setReferrerInput('');
    setIsLoading(false);
  };

  const handleDetectFromUrl = async () => {
    setIsLoading(true);

    addLog({
      type: 'event',
      method: 'detectFromUrl',
      data: { url: window.location.href },
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate detecting a referrer from URL
    const simulatedCode = 'URL_REF_123';

    addLog({
      type: 'response',
      method: 'detected',
      data: {
        detected: true,
        referrerCode: simulatedCode,
        source: 'url_parameter',
      },
    });

    setReferrerCode(simulatedCode);
    setIsLoading(false);
  };

  const handleClearReferrer = async () => {
    addLog({
      type: 'event',
      method: 'clearReferrer',
      data: { previousReferrer: referrerCode },
    });

    setReferrerCode(null);
  };

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
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

        {/* Referrer Attribution */}
        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium mb-2">Referrer Attribution</p>

          {referrerCode ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Referred by: <span className="font-mono font-medium">{referrerCode}</span>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearReferrer}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={referrerInput}
                  onChange={(e) => setReferrerInput(e.target.value)}
                  placeholder="Enter referrer code..."
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleSetReferrer}
                  disabled={isLoading || !referrerInput.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Set'
                  )}
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDetectFromUrl}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="mr-2 h-4 w-4" />
                )}
                Detect from URL
              </Button>
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
