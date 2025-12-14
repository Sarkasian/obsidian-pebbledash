/**
 * Internationalization (i18n) module for Pebbledash.
 * 
 * Currently supports English only. To add a new language:
 * 1. Create a new file (e.g., `de.ts`) with translations following the `en.ts` structure
 * 2. Import and add it to the `translations` object below
 * 3. Update the `SupportedLocale` type
 * 
 * Usage:
 * ```ts
 * import { t, strings } from './i18n';
 * 
 * // Get a string directly
 * const label = strings.commands.createDashboard;
 * 
 * // Or use the t() helper for nested paths
 * const label = t('commands.createDashboard');
 * ```
 */

import { en, type Translations } from './en';

// Supported locales
export type SupportedLocale = 'en';

// All available translations
const translations: Record<SupportedLocale, Translations> = {
  en,
};

// Current locale (can be made configurable in the future)
let currentLocale: SupportedLocale = 'en';

/**
 * Get the current translation strings.
 */
export const strings: Translations = translations[currentLocale];

/**
 * Set the current locale.
 * @param locale - The locale code to switch to
 */
export function setLocale(locale: SupportedLocale): void {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

/**
 * Get the current locale.
 */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * Get a nested translation value by dot-notation path.
 * 
 * @param path - Dot-notation path to the translation key
 * @returns The translation string or the path if not found
 * 
 * @example
 * t('commands.createDashboard') // "Create new dashboard"
 * t('notices.dashboardSaved') // "Dashboard saved"
 */
export function t(path: string): string {
  const keys = path.split('.');
  let result: unknown = strings;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      // Return the path as fallback if translation not found
      return path;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

// Re-export types
export type { Translations } from './en';

