import { useEffect } from 'react';
import { SITE } from '@/lib/constants';

/** Per-page <title> and meta description. */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE.name}` : `${SITE.name} — Discover events worth showing up for`;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
