import { Reveal } from './Reveal';
import { cn } from '@/lib/cn';

export function Eyebrow({ children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.2em] text-muted uppercase', className)}>
      <span className="h-px w-6 bg-line-strong" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className, align = 'left' }) {
  return (
    <div className={cn('flex flex-col gap-6 md:flex-row md:items-end md:justify-between', align === 'center' && 'items-center text-center md:flex-col md:items-center', className)}>
      <Reveal className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h2 className="font-display-tight text-[clamp(2.2rem,5vw,3.75rem)] font-bold text-balance">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-base text-muted text-balance sm:text-lg">{description}</p>}
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}
