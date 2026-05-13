export type ThemeMode = 'light' | 'dark' | 'system';

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const v = localStorage.getItem('sl-theme');
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'dark';
}

export function resolveThemeClass(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Applies `light` or `dark` on `document.documentElement` and persists mode to localStorage. */
export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  const resolved = resolveThemeClass(mode);
  root.classList.add(resolved);
  localStorage.setItem('sl-theme', mode);
}

export function subscribeSystemTheme(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}
