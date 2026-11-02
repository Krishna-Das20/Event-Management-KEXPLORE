import { DropdownMenu as M } from 'radix-ui';
import { useNavigate } from 'react-router';
import { Heart, LogOut, Moon, Sun, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { useSignOut } from '@/lib/queries';
import { useTheme } from '@/providers/ThemeProvider';

const itemCls =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors data-[highlighted]:bg-surface-2';

export function UserMenu({ user, onOpenChange }) {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { theme, toggleTheme } = useTheme();

  return (
    <M.Root modal={false} onOpenChange={onOpenChange}>
      <M.Trigger
        className="rounded-full ring-offset-2 ring-offset-bg transition hover:ring-2 hover:ring-line-strong"
        aria-label="Account menu"
      >
        <Avatar name={user.name} src={user.avatar} className="size-9" />
      </M.Trigger>
      <M.Portal>
        <M.Content
          align="end"
          sideOffset={10}
          className="z-[90] w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl data-[state=open]:[animation:pop-in_.2s_var(--ease-out-expo)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user.name} src={user.avatar} className="size-10" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
          </div>
          <M.Separator className="my-1 h-px bg-line" />
          <M.Item className={itemCls} onSelect={() => navigate('/tickets')}>
            <Ticket className="size-4 text-muted" /> My tickets
          </M.Item>
          <M.Item className={itemCls} onSelect={() => navigate('/tickets?tab=saved')}>
            <Heart className="size-4 text-muted" /> Saved events
          </M.Item>
          <M.Item className={itemCls} onSelect={(e) => toggleTheme(e.detail?.originalEvent)}>
            {theme === 'dark' ? <Sun className="size-4 text-muted" /> : <Moon className="size-4 text-muted" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </M.Item>
          <M.Separator className="my-1 h-px bg-line" />
          <M.Item
            className={itemCls}
            onSelect={() =>
              signOut.mutate(undefined, {
                onSuccess: () => toast('Signed out', { description: 'Tickets on this device are still available.' }),
              })
            }
          >
            <LogOut className="size-4 text-muted" /> Sign out
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
