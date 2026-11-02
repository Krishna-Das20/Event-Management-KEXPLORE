import { create } from 'zustand';

/** Ephemeral UI state shared across distant components (not persisted). */
export const useUiStore = create((set) => ({
  paletteOpen: false,
  signInOpen: false,
  signInReason: null,
  usingFallback: false,
  setUsingFallback: (usingFallback) => set({ usingFallback }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  openSignIn: (reason = null) => set({ signInOpen: true, signInReason: reason }),
  setSignInOpen: (signInOpen) => set({ signInOpen }),
}));
