'use client';

import * as React from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useIdentify } from '@gamify/react';
import { useAddLog } from './demo-provider';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
}

const demoUsers: DemoUser[] = [
  { id: 'demo_bronze', name: 'Alex Bronze', email: 'alex@demo.com', tier: 'Bronze', points: 500 },
  { id: 'demo_silver', name: 'Sam Silver', email: 'sam@demo.com', tier: 'Silver', points: 2500 },
  { id: 'demo_gold', name: 'Jordan Gold', email: 'jordan@demo.com', tier: 'Gold', points: 7500 },
  { id: 'demo_new', name: 'New Customer', email: 'new@demo.com', tier: 'None', points: 0 },
];

interface DemoUserPanelProps {
  currentUser: DemoUser | null;
  onSelectUser: (user: DemoUser) => void;
  onLogout: () => void;
}

export function DemoUserPanel({ currentUser, onSelectUser, onLogout }: DemoUserPanelProps) {
  const identify = useIdentify();
  const addLog = useAddLog();

  const handleSelectUser = (user: DemoUser) => {
    addLog({
      type: 'request',
      method: 'identify',
      data: {
        userId: user.id,
        traits: {
          name: user.name,
          email: user.email,
          tier: user.tier,
        },
      },
    });

    // Call SDK identify
    identify(user.id, {
      name: user.name,
      email: user.email,
      tier: user.tier,
    });

    addLog({
      type: 'response',
      method: 'identify',
      data: {
        success: true,
        userId: user.id,
        anonymousId: `anon_${Math.random().toString(36).substring(2, 10)}`,
      },
    });

    onSelectUser(user);
  };

  const handleLogout = () => {
    addLog({
      type: 'event',
      method: 'reset',
      data: { previousUserId: currentUser?.id },
    });

    // Note: SDK reset() would be called here in production
    onLogout();
  };

  return (
    <GlassCard>
      <GlassCardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            {currentUser ? (
              <div>
                <p className="font-medium text-sm">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-sm">Select a User</p>
                <p className="text-xs text-muted-foreground">Choose a demo account</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {currentUser ? 'Switch User' : 'Select User'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {demoUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.tier} - {user.points.toLocaleString()} pts
                    </span>
                  </DropdownMenuItem>
                ))}
                {currentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

export { demoUsers };
