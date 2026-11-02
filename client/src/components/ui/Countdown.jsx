import { AnimatePresence, motion } from 'motion/react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/cn';

const pad = (n) => String(n).padStart(2, '0');

/** A single digit that rolls vertically when it changes. */
function RollingDigit({ value }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center leading-none">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label, size }) {
  const digits = pad(value).split('');
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex font-mono font-semibold tabular',
          size === 'lg' && 'rounded-2xl border border-line bg-surface px-3 py-3 text-4xl shadow-card sm:text-5xl',
          size === 'md' && 'rounded-xl border border-line bg-surface-2 px-2 py-2 text-2xl',
          size === 'sm' && 'text-sm',
        )}
      >
        {digits.map((d, i) => (
          <RollingDigit key={i} value={d} />
        ))}
      </div>
      {size !== 'sm' && <span className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">{label}</span>}
    </div>
  );
}

/**
 * Event countdown with rolling digits.
 *  size="lg" → hero/detail page blocks, "md" → cards, "sm" → inline text.
 */
export function Countdown({ target, end, size = 'md', className }) {
  const { days, hours, minutes, seconds, done } = useCountdown(target);
  const ended = end && new Date(end).getTime() < Date.now();

  if (done) {
    return (
      <div className={cn('inline-flex items-center gap-2 font-mono text-sm font-semibold', className)}>
        <span className={cn('size-2 rounded-full', ended ? 'bg-muted' : 'bg-success animate-pulse')} />
        {ended ? 'This event has ended' : 'Happening now'}
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <span className={cn('font-mono text-xs font-medium tabular', className)} aria-label={`Starts in ${days} days ${hours} hours`}>
        {days > 0 && `${days}d `}
        {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </span>
    );
  }

  const units = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Mins' },
    { value: seconds, label: 'Secs' },
  ];

  return (
    <div className={cn('flex items-start gap-2 sm:gap-3', className)} role="timer" aria-label={`Starts in ${days} days, ${hours} hours and ${minutes} minutes`}>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-start gap-2 sm:gap-3">
          <Unit value={u.value} label={u.label} size={size} />
          {i < units.length - 1 && (
            <span className={cn('font-mono font-semibold text-muted', size === 'lg' ? 'pt-4 text-3xl' : 'pt-2 text-xl')}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}
