import { forwardRef } from 'react';
import { Slot } from 'radix-ui';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const variants = {
  primary:
    'bg-accent text-accent-fg shadow-[0_1px_0_rgb(255_255_255/0.4)_inset,0_10px_30px_-12px_var(--glow)] hover:brightness-[0.96] active:brightness-90',
  dark: 'bg-fg text-bg hover:bg-fg/85',
  secondary: 'bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  outline: 'border border-line-strong text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
  glass: 'bg-white/12 text-white border border-white/20 backdrop-blur-md hover:bg-white/20',
};

const sizes = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-full',
  lg: 'h-14 px-7 text-base gap-2.5 rounded-full',
  icon: 'size-10 rounded-full',
  'icon-sm': 'size-8 rounded-full',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', asChild = false, loading = false, className, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap',
        'transition-[background-color,border-color,filter,transform,opacity] duration-200 ease-out active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});
