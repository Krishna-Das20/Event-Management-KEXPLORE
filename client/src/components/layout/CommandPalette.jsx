import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import { Dialog as D } from 'radix-ui';
import { ArrowRight, CalendarDays, History, Home, LogIn, Moon, Search, Sun, Ticket, Compass } from 'lucide-react';
import { useEvents, useSession } from '@/lib/queries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { CATEGORIES } from '@/lib/constants';
import { formatShortDate } from '@/lib/format';
import { sized } from '@/lib/image';
import { useLibraryStore } from '@/store/saved';
import { useUiStore } from '@/store/ui';
import { useTheme } from '@/providers/ThemeProvider';

const itemCls =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-2 outline-none data-[selected=true]:bg-surface-2 data-[selected=true]:text-fg';

function Group({ heading, children }) {
  return (
    <Command.Group
      heading={heading}
      className="px-2 pb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  );
}

function EventItem({ event, onSelect }) {
  return (
    <Command.Item value={`event-${event.slug}`} onSelect={onSelect} className={itemCls}>
      <img src={sized(event.image, 96)} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-fg">{event.title}</div>
        <div className="truncate text-xs text-muted">
          {formatShortDate(event.startDate)} · {event.venue?.city}
        </div>
      </div>
      <ArrowRight className="size-4 text-muted" />
    </Command.Item>
  );
}

/** ⌘K / Ctrl+K command palette: live event search, recent views, categories, pages & actions. */
export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const openSignIn = useUiStore((s) => s.openSignIn);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSession();
  const recent = useLibraryStore((s) => s.recent);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 200);

  const { data, isFetching } = useEvents({ q: debounced || undefined, limit: 6, when: 'upcoming' }, { enabled: open });
  const events = data?.items ?? [];

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().paletteOpen);
      } else if (e.key === '/' && !/input|textarea|select/i.test(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const go = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const q = query.trim().toLowerCase();
  const match = (text) => !q || text.toLowerCase().includes(q);
  const categories = CATEGORIES.filter((c) => match(c.label));
  const pages = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore all events', path: '/events', icon: Compass },
    { label: 'Register for an event', path: '/register', icon: CalendarDays },
    { label: 'My tickets', path: '/tickets', icon: Ticket },
  ].filter((p) => match(p.label));
  const showTheme = match('theme dark light mode');
  const showSignIn = !user && match('sign in google account');

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm data-[state=open]:[animation:fade-in_.2s_ease-out]" />
        <D.Content
          aria-describedby={undefined}
          className="fixed top-[12dvh] left-1/2 z-[81] w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl outline-none data-[state=open]:[animation:dialog-in_.3s_var(--ease-out-expo)]"
        >
          <D.Title className="sr-only">Search Encore</D.Title>
          <Command shouldFilter={false} loop label="Search events and pages">
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search className={isFetching ? 'size-5 animate-pulse text-accent-text' : 'size-5 text-muted'} />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search events, cities, categories…"
                className="h-16 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">ESC</kbd>
            </div>
            <Command.List data-lenis-prevent className="max-h-[min(60dvh,460px)] overflow-y-auto overscroll-contain py-1">
              <Command.Empty className="px-6 py-12 text-center text-sm text-muted">
                No matches for “{query}”. Try a city like “Bengaluru”.
              </Command.Empty>

              {events.length > 0 && (
                <Group heading={q ? 'Events' : 'Coming up'}>
                  {events.map((e) => (
                    <EventItem key={e.slug} event={e} onSelect={() => go(`/events/${e.slug}`)} />
                  ))}
                  {q && (
                    <Command.Item value="see-all" onSelect={() => go(`/events?q=${encodeURIComponent(query.trim())}`)} className={itemCls}>
                      <Search className="size-4 text-muted" /> See all results for “{query.trim()}”
                    </Command.Item>
                  )}
                </Group>
              )}

              {!q && recent.length > 0 && (
                <Group heading="Recently viewed">
                  {recent.slice(0, 3).map((e) => (
                    <Command.Item key={e.slug} value={`recent-${e.slug}`} onSelect={() => go(`/events/${e.slug}`)} className={itemCls}>
                      <History className="size-4 text-muted" />
                      <span className="truncate">{e.title}</span>
                    </Command.Item>
                  ))}
                </Group>
              )}

              {categories.length > 0 && (
                <Group heading="Categories">
                  {categories.map((c) => (
                    <Command.Item key={c.id} value={`cat-${c.id}`} onSelect={() => go(`/events?category=${c.id}`)} className={itemCls}>
                      <span className="grid size-7 place-items-center rounded-lg" style={{ background: `${c.color}22`, color: c.color }}>
                        <c.icon className="size-4" />
                      </span>
                      {c.label}
                    </Command.Item>
                  ))}
                </Group>
              )}

              {pages.length > 0 && (
                <Group heading="Pages">
                  {pages.map((p) => (
                    <Command.Item key={p.path} value={`page-${p.path}`} onSelect={() => go(p.path)} className={itemCls}>
                      <p.icon className="size-4 text-muted" /> {p.label}
                    </Command.Item>
                  ))}
                </Group>
              )}

              {(showTheme || showSignIn) && (
              <Group heading="Actions">
                {showTheme && (
                  <Command.Item
                    value="toggle-theme"
                    onSelect={() => {
                      setOpen(false);
                      toggleTheme();
                    }}
                    className={itemCls}
                  >
                    {theme === 'dark' ? <Sun className="size-4 text-muted" /> : <Moon className="size-4 text-muted" />}
                    Switch to {theme === 'dark' ? 'light' : 'dark'} mode
                  </Command.Item>
                )}
                {showSignIn && (
                  <Command.Item
                    value="sign-in"
                    onSelect={() => {
                      setOpen(false);
                      openSignIn();
                    }}
                    className={itemCls}
                  >
                    <LogIn className="size-4 text-muted" /> Sign in with Google
                  </Command.Item>
                )}
              </Group>
              )}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
