import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional class names and resolve Tailwind conflicts (last one wins). */
export const cn = (...inputs) => twMerge(clsx(inputs));
