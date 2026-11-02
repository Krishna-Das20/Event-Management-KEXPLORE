import { cn } from '@/lib/cn';

/** Seamless infinite marquee (pure CSS). Content is duplicated once; pauses on hover. */
export function Marquee({ children, className, reverse = false, duration = 40, gap = '2rem', pauseOnHover = true }) {
  return (
    <div className={cn('group flex overflow-hidden mask-fade-x', className)} style={{ '--duration': `${duration}s`, '--gap': gap }}>
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            'flex shrink-0 items-center',
            reverse ? 'animate-marquee-reverse' : 'animate-marquee',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
          style={{ gap, paddingRight: gap }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
