"use client";

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const navItems = [
    { href: '/settings/profile', label: 'Profile', icon: User },
    { href: '/settings/mochi', label: 'Mochi', icon: Sparkles },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 min-h-0">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Settings
      </h1>
      <div className="flex gap-10">
        <nav className="w-44 shrink-0 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Separator className="my-2" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </nav>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
