import { create } from 'zustand';

export type AppPage = 'prepare' | 'presets' | 'about';

interface NavigationState {
  currentPage: AppPage;
  navigateTo: (page: AppPage) => void;
}

const getPageFromHash = (): AppPage => {
  if (typeof window === 'undefined') return 'prepare';
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('preset')) return 'presets';
  if (hash.includes('about') || hash.includes('how-it-works')) return 'about';
  return 'prepare';
};

export const useNavigationStore = create<NavigationState>((set) => {
  // Listen to hash changes in browser
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      set({ currentPage: getPageFromHash() });
    });
  }

  return {
    currentPage: getPageFromHash(),

    navigateTo: (page: AppPage) => {
      if (typeof window !== 'undefined') {
        const hash = page === 'prepare' ? '#/' : `#/${page}`;
        if (window.location.hash !== hash) {
          window.location.hash = hash;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      set({ currentPage: page });
    },
  };
});
