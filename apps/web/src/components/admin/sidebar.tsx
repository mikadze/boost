'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Code,
  Key,
  Webhook,
  Bug,
  Play,
  Settings,
  ChevronDown,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Campaigns',
    href: '/admin/campaigns',
    icon: Megaphone,
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    name: 'Developer',
    icon: Code,
    children: [
      { name: 'API Keys', href: '/admin/developer/api-keys', icon: Key },
      { name: 'Webhooks', href: '/admin/developer/webhooks', icon: Webhook },
      { name: 'Debugger', href: '/admin/developer/debugger', icon: Bug },
    ],
  },
  {
    name: 'Playground',
    href: '/admin/playground',
    icon: Play,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-border',
        'transition-transform duration-300 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Close sidebar"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold gradient-text">Boost</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) =>
          item.children ? (
            <NavGroup key={item.name} item={item} pathname={pathname} />
          ) : (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              active={pathname === item.href}
            >
              {item.name}
            </NavItem>
          )
        )}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <NavItem href="/admin/settings" icon={Settings} active={pathname === '/admin/settings'}>
          Settings
        </NavItem>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  children: React.ReactNode;
}

function NavItem({ href, icon: Icon, active, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}

interface NavGroupProps {
  item: {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    children: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  };
  pathname: string;
}

function NavGroup({ item, pathname }: NavGroupProps) {
  const isActive = item.children.some((child) => pathname.startsWith(child.href));
  const [open, setOpen] = React.useState(isActive);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          {item.name}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 mt-1 space-y-1">
        {item.children.map((child) => (
          <Link
            key={child.name}
            href={child.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === child.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
            )}
          >
            <child.icon className="h-4 w-4" />
            {child.name}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
