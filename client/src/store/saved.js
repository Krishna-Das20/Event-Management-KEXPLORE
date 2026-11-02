import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { eventSnapshot } from './tickets';

const MAX_RECENT = 8;

/** Saved (bookmarked) and recently viewed events — both persisted in Local Storage. */
export const useLibraryStore = create()(
  persist(
    (set, get) => ({
      saved: [],
      recent: [],

      isSaved: (slug) => get().saved.some((e) => e.slug === slug),

      toggleSave: (event) => {
        const exists = get().saved.some((e) => e.slug === event.slug);
        set((s) => ({
          saved: exists ? s.saved.filter((e) => e.slug !== event.slug) : [{ ...eventSnapshot(event), savedAt: Date.now() }, ...s.saved],
        }));
        return !exists;
      },

      trackView: (event) =>
        set((s) => ({
          recent: [eventSnapshot(event), ...s.recent.filter((e) => e.slug !== event.slug)].slice(0, MAX_RECENT),
        })),

      clearRecent: () => set({ recent: [] }),
    }),
    { name: 'encore.library', version: 1 },
  ),
);
