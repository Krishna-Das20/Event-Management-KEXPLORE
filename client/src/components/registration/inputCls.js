import { cn } from '@/lib/cn';

/** Shared text-input styling for the registration form (error-aware). */
export const inputCls = (error, extra) =>
  cn(
    'h-13 w-full rounded-2xl border bg-surface px-4 pr-12 text-[15px] outline-none transition placeholder:text-muted/70',
    'focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent)_35%,transparent)]',
    error ? 'border-danger focus:border-danger' : 'border-line hover:border-line-strong focus:border-fg/40',
    extra,
  );
