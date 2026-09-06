import { create } from 'zustand';

export const useModeStore = create((set) => ({
  mode: localStorage.getItem('damda_ai_mode') || 'mock', // 'mock' | 'real'
  setMode: (newMode) => {
    localStorage.setItem('damda_ai_mode', newMode);
    set({ mode: newMode });
  },
  toggleMode: () => {
    set((state) => {
      const next = state.mode === 'mock' ? 'real' : 'mock';
      localStorage.setItem('damda_ai_mode', next);
      return { mode: next };
    });
  },
}));

export const getAiMode = () => {
  return localStorage.getItem('damda_ai_mode') || 'mock';
};
