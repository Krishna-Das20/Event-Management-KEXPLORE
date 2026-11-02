import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useLibraryStore } from '@/store/saved';
import { cn } from '@/lib/cn';

/** Bookmark toggle with a little particle burst; persisted in Local Storage. */
export function SaveButton({ event, className, variant = 'glass' }) {
  const saved = useLibraryStore((s) => s.saved.some((e) => e.slug === event.slug));
  const toggleSave = useLibraryStore((s) => s.toggleSave);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggleSave(event);
    toast(nowSaved ? 'Saved to your list' : 'Removed from saved', {
      description: event.title,
      icon: <Heart className={cn('size-4', nowSaved && 'fill-[#ff4d8d] text-[#ff4d8d]')} />,
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${event.title} from saved` : `Save ${event.title}`}
      className={cn(
        'relative grid size-10 place-items-center rounded-full transition active:scale-90',
        variant === 'glass' && 'bg-black/35 text-white backdrop-blur-md hover:bg-black/55',
        variant === 'surface' && 'border border-line bg-surface text-fg hover:bg-surface-2',
        className,
      )}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
        <Heart className={cn('size-[18px] transition-colors', saved && 'fill-[#ff4d8d] text-[#ff4d8d]')} />
      </motion.span>
      <AnimatePresence>
        {saved && (
          <motion.span className="pointer-events-none absolute inset-0" initial="hidden" animate="show" exit="hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-[#ff4d8d]"
                variants={{
                  hidden: { x: '-50%', y: '-50%', opacity: 0, scale: 0 },
                  show: {
                    x: `calc(-50% + ${Math.cos((i / 6) * Math.PI * 2) * 22}px)`,
                    y: `calc(-50% + ${Math.sin((i / 6) * Math.PI * 2) * 22}px)`,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.4],
                    transition: { duration: 0.6, ease: 'easeOut' },
                  },
                }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
