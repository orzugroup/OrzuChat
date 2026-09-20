export const THEME_STORAGE_KEY = 'orzuchat-theme';

/**
 * Runs before first paint: applies a saved preference if there is one, and
 * otherwise falls back to the operating system's prefers-color-scheme.
 */
const script = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
