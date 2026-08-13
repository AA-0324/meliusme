import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL, PUBLIC_ROUTES } from '@/config/site';

/**
 * Route-aware head metadata for a client-rendered SPA.
 *
 * - Public routes (see PUBLIC_ROUTES) get a self-referencing canonical and
 *   `index, follow`.
 * - Every other route is a private, on-device app screen: it gets
 *   `noindex, nofollow` and no canonical at all, so it never advertises the
 *   public landing page as its own canonical URL.
 *
 * No head library is used — this is a few lines of DOM work against tags that
 * already exist in index.html.
 */
const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href: string | null) => {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.createElement('link');
  el.setAttribute('rel', 'canonical');
  el.setAttribute('href', href);
  if (!existing) document.head.appendChild(el);
};

const setOgUrl = (url: string | null) => {
  const el = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!el) return;
  if (url) el.setAttribute('content', url);
  else el.remove();
};

export const RouteHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const isPublic = (PUBLIC_ROUTES as readonly string[]).includes(normalized);

    if (isPublic) {
      const url = `${SITE_URL}${normalized === '/' ? '/' : normalized}`;
      setMeta('robots', 'index, follow');
      setCanonical(url);
      setOgUrl(url);
    } else {
      setMeta('robots', 'noindex, nofollow');
      setCanonical(null);
      setOgUrl(null);
    }
  }, [pathname]);

  return null;
};
