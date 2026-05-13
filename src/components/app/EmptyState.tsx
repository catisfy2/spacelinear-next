import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-4 py-16 text-center',
        className,
      )}
    >
      {icon ? <div className="text-4xl leading-none">{icon}</div> : null}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
