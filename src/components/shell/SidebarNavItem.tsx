'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  isActive,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  isActive: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-2 py-1.5 text-sm transition-colors',
        collapsed ? 'justify-center' : 'gap-2.5',
        isActive
          ? 'bg-accent font-medium text-foreground'
          : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
