import { cn } from '@/lib/utils';

const maxWidthClass = {
  narrow: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-none',
} as const;

export type PageShellMaxWidth = keyof typeof maxWidthClass;

export function PageShell({
  children,
  className,
  maxWidth = 'wide',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: PageShellMaxWidth;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-h-0',
        maxWidthClass[maxWidth],
        padded && 'px-6 py-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
