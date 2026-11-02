import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

/** Pill-style tab switcher with a sliding active indicator. */
export function SegmentedControl({ options, value, onChange, className, size = 'md', label }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-full border border-line bg-surface p-1', className)}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'relative z-0 rounded-full font-medium whitespace-nowrap transition-colors',
              size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs',
              active ? 'text-bg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-full bg-fg"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="inline-flex items-center gap-1.5">
              {opt.icon && <opt.icon className="size-3.5" aria-hidden />}
              {opt.label}
              {typeof opt.count === 'number' && <span className="opacity-60">{opt.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
