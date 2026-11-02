import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { ArrowDownWideNarrow, LayoutGrid, List, LoaderCircle, RotateCw, Search, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { EventRow, EventRowSkeleton } from '@/components/events/EventRow';
import { useInfiniteEvents, useEventsMeta } from '@/lib/queries';
import { CATEGORIES, CATEGORY_MAP, PRICE_OPTIONS, SORT_OPTIONS, WHEN_OPTIONS } from '@/lib/constants';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';

const VIEW_KEY = 'encore.view';
const DEFAULTS = { when: 'upcoming', price: 'all', sort: 'date' };

function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters = {
    q: params.get('q') ?? '',
    category: (params.get('category') ?? '').split(',').filter((c) => CATEGORY_MAP[c]),
    when: params.get('when') ?? DEFAULTS.when,
    price: params.get('price') ?? DEFAULTS.price,
    sort: params.get('sort') ?? DEFAULTS.sort,
  };

  const update = (patch) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          const v = Array.isArray(value) ? value.join(',') : value;
          if (!v || v === DEFAULTS[key]) next.delete(key);
          else next.set(key, v);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };

  const reset = () => setParams({}, { replace: true, preventScrollReset: true });
  return { filters, update, reset };
}

function CategoryChips({ selected, onChange, counts }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        type="button"
        onClick={() => onChange([])}
        aria-pressed={selected.length === 0}
        className={cn(
          'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
          selected.length === 0 ? 'border-fg bg-fg text-bg' : 'border-line bg-surface text-fg-2 hover:border-line-strong',
        )}
      >
        All categories
      </button>
      {CATEGORIES.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            aria-pressed={active}
            style={{ '--c': c.color }}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
              active ? 'border-transparent bg-[var(--c)] text-black' : 'border-line bg-surface text-fg-2 hover:border-line-strong',
            )}
          >
            <c.icon className={cn('size-4', !active && 'text-[var(--c)]')} />
            {c.label}
            {counts?.[c.id] !== undefined && <span className={cn('text-xs', active ? 'text-black/60' : 'text-muted')}>{counts[c.id]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function LoadMoreSentinel({ onVisible, disabled }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '400px 0px' });
  useEffect(() => {
    if (inView && !disabled) onVisible();
  }, [inView, disabled, onVisible]);
  return <div ref={ref} aria-hidden className="h-px" />;
}

export default function Events() {
  const { filters, update, reset } = useFilters();
  const [search, setSearch] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) ?? 'grid');
  const { data: meta } = useEventsMeta();

  useDocumentTitle('Explore events', 'Search and filter upcoming concerts, hackathons, workshops, comedy and food events across India.');

  // Keep the URL in sync with the debounced search box.
  useEffect(() => {
    if (debouncedSearch.trim() !== filters.q) update({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Reflect external URL changes (e.g. command palette) back into the input.
  const [lastQ, setLastQ] = useState(filters.q);
  if (filters.q !== lastQ) {
    setLastQ(filters.q);
    if (filters.q !== debouncedSearch.trim()) setSearch(filters.q);
  }

  const queryParams = useMemo(
    () => ({ q: filters.q || undefined, category: filters.category, when: filters.when, price: filters.price, sort: filters.sort, limit: 9 }),
    [filters.q, filters.category, filters.when, filters.price, filters.sort],
  );
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isPlaceholderData } =
    useInfiniteEvents(queryParams);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const activeCount =
    (filters.q ? 1 : 0) + filters.category.length + (filters.when !== DEFAULTS.when) + (filters.price !== DEFAULTS.price) + (filters.sort !== DEFAULTS.sort);

  const setViewPersist = (v) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  return (
    <div className="container-x pt-32 pb-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow className="mb-4">Explore</Eyebrow>
          <h1 className="font-display-tight text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold">
            Find your <span className="font-serif font-normal italic">scene.</span>
          </h1>
          <p className="mt-3 max-w-lg text-muted">
            {meta ? `${meta.stats.upcoming} upcoming events in ${meta.stats.cities} cities.` : 'Loading the lineup…'} Search, filter and save
            the ones you love.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <label className="relative flex-1 lg:w-96">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, venue or tag"
              className="h-12 w-full rounded-full border border-line bg-surface pr-11 pl-12 text-[15px] outline-none transition placeholder:text-muted focus:border-line-strong [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>
      </header>

      <section aria-label="Filters" className="mt-10 space-y-4 rounded-[28px] border border-line bg-surface/60 p-4 sm:p-5">
        <CategoryChips selected={filters.category} onChange={(category) => update({ category })} counts={meta?.categories} />
        <div className="flex flex-col gap-3 border-t border-line pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <SegmentedControl options={WHEN_OPTIONS} value={filters.when} onChange={(when) => update({ when })} size="sm" label="Date" />
            <SegmentedControl options={PRICE_OPTIONS} value={filters.price} onChange={(price) => update({ price })} size="sm" label="Price" />
          </div>
          <div className="flex items-center gap-2">
            <label className="relative flex-1 xl:flex-none">
              <span className="sr-only">Sort by</span>
              <ArrowDownWideNarrow className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-10 w-full appearance-none rounded-full border border-line bg-surface pr-9 pl-10 text-sm font-medium outline-none hover:border-line-strong xl:w-auto"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-muted">▾</span>
            </label>
            <SegmentedControl
              options={[
                { id: 'grid', label: <span className="sr-only">Grid view</span>, icon: LayoutGrid },
                { id: 'list', label: <span className="sr-only">List view</span>, icon: List },
              ]}
              value={view}
              onChange={setViewPersist}
              size="sm"
              label="Layout"
            />
          </div>
        </div>
      </section>

      <div className="mt-8 flex min-h-8 flex-wrap items-center justify-between gap-3" aria-live="polite">
        <p className="text-sm text-muted">
          {isLoading ? (
            'Searching…'
          ) : (
            <>
              <span className="font-semibold text-fg">{total}</span> {total === 1 ? 'event' : 'events'} found
              {filters.q && (
                <>
                  {' '}
                  for “<span className="text-fg">{filters.q}</span>”
                </>
              )}
            </>
          )}
          {isFetching && !isLoading && <LoaderCircle className="ml-2 inline size-4 animate-spin" />}
        </p>
        {activeCount > 0 && (
          <button type="button" onClick={() => (setSearch(''), reset())} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-2 hover:text-fg">
            <X className="size-4" /> Clear {activeCount} filter{activeCount > 1 && 's'}
          </button>
        )}
      </div>

      <div className={cn('mt-6 transition-opacity duration-300', isPlaceholderData && 'opacity-50')}>
        {isError ? (
          <EmptyState
            icon={RotateCw}
            title="Couldn’t load events"
            description={error?.message}
            action={
              <Button onClick={() => refetch()} variant="dark">
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <div className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {Array.from({ length: 6 }).map((_, i) => (view === 'grid' ? <EventCardSkeleton key={i} /> : <EventRowSkeleton key={i} />))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No events match those filters"
            description="Try a different keyword, widen the date range, or clear a category or two."
            action={
              <Button onClick={() => (setSearch(''), reset())} variant="dark">
                Reset filters
              </Button>
            }
          />
        ) : (
          <motion.div layout className={view === 'grid' ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((event, i) => (
                <motion.div
                  key={event.slug}
                  layout="position"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: (i % 9) * 0.035, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                >
                  {view === 'grid' ? <EventCard event={event} priority={i < 3} /> : <EventRow event={event} />}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <LoadMoreSentinel onVisible={fetchNextPage} disabled={isFetchingNextPage} />
          <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more events
          </Button>
        </div>
      )}
      {!hasNextPage && items.length > 0 && <p className="mt-12 text-center font-mono text-xs tracking-[0.2em] text-muted uppercase">✱ You’ve reached the end ✱</p>}
    </div>
  );
}
