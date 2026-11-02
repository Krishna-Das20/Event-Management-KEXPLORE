import { Dialog as D } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Accessible modal built on Radix (focus trap, Esc to close, scroll lock, aria wiring).
 * `data-lenis-prevent` lets the dialog body scroll natively while smooth scrolling is active.
 */
export function Dialog({ open, onOpenChange, trigger, title, description, children, className, hideTitle = false, size = 'md' }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm data-[state=open]:[animation:fade-in_.25s_ease-out]" />
        <D.Content
          data-lenis-prevent
          className={cn(
            'fixed top-1/2 left-1/2 z-[81] max-h-[92dvh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl outline-none sm:p-8',
            'data-[state=open]:[animation:dialog-in_.35s_var(--ease-out-expo)]',
            size === 'sm' && 'max-w-md',
            size === 'md' && 'max-w-lg',
            size === 'lg' && 'max-w-2xl',
            className,
          )}
        >
          <D.Title className={cn('font-display text-2xl font-bold tracking-tight', hideTitle && 'sr-only')}>{title}</D.Title>
          {description ? (
            <D.Description className={cn('mt-1.5 text-sm text-muted', hideTitle && 'sr-only')}>{description}</D.Description>
          ) : (
            <D.Description className="sr-only">{title}</D.Description>
          )}
          {children}
          <D.Close
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </D.Close>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DialogClose = D.Close;
