import { cn } from '@/lib/cn';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center', className)}>
      {Icon && (
        <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-surface-2 text-fg-2">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h3 className="font-display text-2xl font-bold tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
