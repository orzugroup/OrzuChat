'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from './Icons';
import { THEME_STORAGE_KEY } from './ThemeScript';

export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      /* storage can be unavailable in private mode — the toggle still works for this session */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      aria-pressed={dark ?? false}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted transition hover:border-brand-blue/40 hover:text-brand-blue-deep dark:border-navy-line dark:bg-navy-alt/60 dark:text-navy-muted dark:hover:border-brand-cyan/40 dark:hover:text-brand-cyan"
    >
      <SunIcon className="h-[18px] w-[18px] dark:hidden" />
      <MoonIcon className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
