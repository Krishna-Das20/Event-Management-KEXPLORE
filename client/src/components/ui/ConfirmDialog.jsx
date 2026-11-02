import { AlertDialog as A } from 'radix-ui';
import { Button } from './Button';

/** Accessible confirmation prompt for destructive actions (role="alertdialog"). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', tone = 'danger', onConfirm, loading }) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-[85] bg-black/55 backdrop-blur-sm data-[state=open]:[animation:fade-in_.2s_ease-out]" />
        <A.Content
          data-lenis-prevent
          className="fixed top-1/2 left-1/2 z-[86] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-surface p-6 shadow-2xl data-[state=open]:[animation:dialog-in_.3s_var(--ease-out-expo)] sm:p-7"
        >
          <A.Title className="font-display text-2xl font-bold tracking-tight">{title}</A.Title>
          <A.Description className="mt-2 text-sm text-muted">{description}</A.Description>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel asChild>
              <Button variant="secondary">Keep it</Button>
            </A.Cancel>
            <Button
              variant={tone === 'danger' ? 'danger' : 'dark'}
              loading={loading}
              onClick={async (e) => {
                e.preventDefault();
                await onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
