/**
 * Single source of truth for the public site origin.
 *
 * Production override: set `VITE_SITE_URL` (e.g. https://meliusme.lovable.app)
 * if the app is served from a custom domain. Falls back to the current
 * published origin.
 */
export const SITE_URL = (
  (import.meta.env?.VITE_SITE_URL as string | undefined)?.trim() || 'https://meliusme.lovable.app'
).replace(/\/$/, '');

export const SITE_NAME = 'MeliusMe';

/** Public, indexable routes. All other routes are private app screens. */
export const PUBLIC_ROUTES = ['/'] as const;
