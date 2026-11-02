import { useState } from 'react';
import { Popover } from 'radix-ui';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { formatPrice, formatShortDate } from '@/lib/format';
import { sized } from '@/lib/image';
import { cn } from '@/lib/cn';

/** Searchable event combobox with thumbnails, built on Radix Popover + cmdk. */
export function EventPicker({ id, events, value, onChange, onBlur, error, loading }) {
  const [open, setOpen] = useState(false);
  const selected = events.find((e) => e.id === value);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur?.();
      }}
    >
      <Popover.Trigger
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-surface p-2 pr-4 text-left transition',
          'focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent)_35%,transparent)] focus:outline-none',
          error ? 'border-danger' : 'border-line hover:border-line-strong',
        )}
      >
        {selected ? (
          <>
            <img src={sized(selected.image, 160)} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{selected.title}</span>
              <span className="block truncate text-sm text-muted">
                {formatShortDate(selected.startDate)} · {selected.venue?.city} · {formatPrice(selected.price)}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 px-2 text-[15px] text-muted">{loading ? 'Loading events…' : 'Select an event to attend'}</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-[90] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl data-[state=open]:[animation:pop-in_.2s_var(--ease-out-expo)]"
        >
          <Command loop>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <Search className="size-4 text-muted" />
              <Command.Input placeholder="Search events…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
            </div>
            <Command.List data-lenis-prevent className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="py-8 text-center text-sm text-muted">No upcoming events match.</Command.Empty>
              {events.map((e) => (
                <Command.Item
                  key={e.id}
                  value={`${e.title} ${e.venue?.city} ${e.category}`}
                  disabled={e.seatsLeft === 0}
                  onSelect={() => {
                    onChange(e.id);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-2 outline-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-45 data-[selected=true]:bg-surface-2"
                >
                  <img src={sized(e.image, 120)} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.title}</div>
                    <div className="truncate text-xs text-muted">
                      {formatShortDate(e.startDate)} · {e.venue?.city} · {e.seatsLeft === 0 ? 'Sold out' : formatPrice(e.price)}
                    </div>
                  </div>
                  {e.id === value && <Check className="size-4 shrink-0" />}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
