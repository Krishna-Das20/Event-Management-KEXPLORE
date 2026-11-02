import { cn } from '@/lib/cn';

/** Encore wordmark — an asterisk "spark" + the name set in the display face. */
export function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-accent" />
      <g stroke="#0b0b0c" strokeWidth="3.2" strokeLinecap="round">
        <path d="M16 7.5v17" />
        <path d="M8.64 11.75l14.72 8.5" />
        <path d="M8.64 20.25l14.72-8.5" />
      </g>
    </svg>
  );
}

/** `compact` folds the wordmark away (animated), leaving just the spark. */
export function Logo({ className, compact = false }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <LogoMark className="size-8 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:rotate-[60deg]" />
      <span
        className={cn(
          'overflow-x-clip font-display text-[1.35rem] font-bold tracking-[-0.04em] whitespace-nowrap transition-[max-width,opacity,padding] duration-500 ease-out motion-reduce:transition-none',
          compact ? 'max-w-0 pl-0 opacity-0' : 'max-w-[6rem] pl-2 opacity-100',
        )}
      >
        encore
      </span>
    </span>
  );
}
