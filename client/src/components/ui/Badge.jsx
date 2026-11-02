import { CATEGORY_MAP } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function Badge({ className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-xs font-medium text-fg-2 backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Category pill tinted with the category colour.
 * variant: "tone" (default, on surfaces) · "solid" · "image" (glass, for use over photos)
 */
export function CategoryChip({ category, className, withIcon = true, variant = 'tone' }) {
  const meta = CATEGORY_MAP[category];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      style={{ '--c': meta.color }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight',
        variant === 'tone' && 'chip-tone',
        variant === 'solid' && 'border-transparent bg-[var(--c)] text-black',
        variant === 'image' && 'border-white/15 bg-black/40 text-white backdrop-blur-md',
        className,
      )}
    >
      {withIcon && <Icon className={cn('size-3.5', variant === 'image' && 'text-[var(--c)]')} aria-hidden />}
      {meta.label}
    </span>
  );
}

/** Pulsing status dot ("live", "selling fast"). */
export function PulseDot({ className, color = 'var(--accent)' }) {
  return (
    <span className={cn('relative inline-flex size-2', className)} aria-hidden>
      <span className="absolute inset-0 animate-pulse-ring rounded-full" style={{ background: color }} />
      <span className="relative inline-flex size-2 rounded-full" style={{ background: color }} />
    </span>
  );
}
