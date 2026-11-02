import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Label + control + animated error/hint, wired up with aria attributes. */
export function Field({ id, label, hint, error, valid, required, children, className, action }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
        {action}
      </div>
      <div className={cn('relative', error && 'animate-shake')}>
        {children}
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
          {error ? (
            <CircleAlert className="size-5 text-danger" aria-hidden />
          ) : valid ? (
            <CircleCheck className="size-5 text-success" aria-hidden />
          ) : null}
        </span>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-sm font-medium text-danger"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p key="hint" id={`${id}-hint`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted">
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
