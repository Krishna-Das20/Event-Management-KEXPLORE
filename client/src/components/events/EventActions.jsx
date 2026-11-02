import { DropdownMenu as M } from 'radix-ui';
import { CalendarPlus, Check, Link2, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { googleCalendarUrl, downloadIcs } from '@/lib/calendar';
import { cn } from '@/lib/cn';

const btn = 'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition hover:border-line-strong hover:bg-surface-2';
const itemCls = 'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-surface-2';

export function AddToCalendar({ event, ticketCode, className }) {
  return (
    <M.Root modal={false}>
      <M.Trigger className={cn(btn, className)}>
        <CalendarPlus className="size-4" /> Calendar
      </M.Trigger>
      <M.Portal>
        <M.Content sideOffset={8} align="start" className="z-[90] w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl data-[state=open]:[animation:pop-in_.2s_var(--ease-out-expo)]">
          <M.Item className={itemCls} onSelect={() => window.open(googleCalendarUrl(event), '_blank', 'noopener')}>
            <span className="grid size-7 place-items-center rounded-lg bg-[#4285f4]/15 text-xs font-bold text-[#4285f4]">G</span>
            Google Calendar
          </M.Item>
          <M.Item
            className={itemCls}
            onSelect={() => {
              downloadIcs(event, ticketCode);
              toast.success('Calendar file downloaded', { description: 'Open it to add the event with a 2-hour reminder.' });
            }}
          >
            <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-xs font-bold">.ics</span>
            Apple / Outlook (.ics)
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export function ShareButton({ event, className }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/events/${event.slug}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.tagline, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied', { description: 'Share it with your friends.', icon: <Link2 className="size-4" /> });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy the link');
    }
  };

  return (
    <button type="button" onClick={share} className={cn(btn, className)}>
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />} {copied ? 'Copied' : 'Share'}
    </button>
  );
}
