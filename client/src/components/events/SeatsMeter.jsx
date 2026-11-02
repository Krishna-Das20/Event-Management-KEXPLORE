import { motion } from 'motion/react';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Capacity bar — turns urgent when fewer than 15% of seats remain. */
export function SeatsMeter({ event, className, showLabel = true }) {
  const pct = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const left = event.seatsLeft ?? Math.max(0, event.capacity - event.registeredCount);
  const urgent = left > 0 && left / event.capacity <= 0.15;
  const soldOut = left === 0;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className={cn('font-medium', soldOut ? 'text-danger' : urgent ? 'text-[#ff7a45]' : 'text-muted')}>
            {soldOut ? 'Sold out' : urgent ? `Only ${left} left — selling fast` : `${formatCompact(left)} seats left`}
          </span>
          <span className="font-mono text-muted tabular">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Seats filled">
        <motion.div
          className={cn('h-full rounded-full', soldOut ? 'bg-danger' : urgent ? 'bg-[#ff7a45]' : 'bg-fg')}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
