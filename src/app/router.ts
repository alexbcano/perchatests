import { useEffect, useState } from 'react';
import { useApp } from './store';
import type { GenRequest } from '@/domain/types';

export type Route = 'inicio' | 'crear' | 'tendencias' | 'referentes' | 'armario' | 'favoritos' | 'perfil';
export const ROUTES: Route[] = ['inicio', 'crear', 'tendencias', 'referentes', 'armario', 'favoritos', 'perfil'];

const read = () => window.location.hash.replace(/^#/, '');
export const parseRoute = (h: string): Route => (ROUTES.includes(h as Route) ? (h as Route) : 'inicio');

/** Rutas con hash simple (#crear): funcionan en cualquier alojamiento estático y dentro de un iframe. */
export function useHash(): string {
  const [hash, setHash] = useState(read());
  useEffect(() => {
    const on = () => setHash(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export function go(route: Route) {
  if (read() === route) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else window.location.hash = route;
  window.scrollTo({ top: 0 });
  document.getElementById('main-scroll')?.scrollTo({ top: 0 });
}

/** Abre «Crear outfit» con una petición ya preparada y la ejecuta. */
export function createWith(req: Partial<GenRequest>) {
  useApp.setState({ pending: req, open: null });
  go('crear');
}
