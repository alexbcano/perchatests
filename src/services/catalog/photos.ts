// Comprueba, una vez por visita, si el navegador puede cargar fotos desde la web de cada tienda.
// Algunos alojamientos (y algunas tiendas) lo impiden; entonces la app usa sus propios dibujos.
import { useSyncExternalStore } from 'react';
import { REAL_CATALOG } from '@/data/real/catalog';

export type PhotoStatus = 'pending' | 'ok' | 'blocked';
const status = new Map<string, PhotoStatus>();
const listeners = new Set<() => void>();
let version = 0;
let started = false;

export const hostOf = (url?: string) => { try { return url ? new URL(url).host : ''; } catch { return ''; } };

function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const sample = new Map<string, string>();
  for (const p of REAL_CATALOG) { const h = hostOf(p.imageUrl); if (h && !sample.has(h)) sample.set(h, p.imageUrl!); }
  sample.forEach((url, host) => {
    status.set(host, 'pending');
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    const done = (s: PhotoStatus) => { status.set(host, s); version++; listeners.forEach((l) => l()); };
    img.onload = () => done(img.naturalWidth > 1 ? 'ok' : 'blocked');
    img.onerror = () => done('blocked');
    img.src = url;
  });
}

export function usePhotoStatus(): Map<string, PhotoStatus> {
  start();
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => version);
  return status;
}
export const photoOk = (url: string | undefined, st: Map<string, PhotoStatus>) => !!url && st.get(hostOf(url)) === 'ok';
