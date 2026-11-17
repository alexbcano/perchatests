// Persistencia. La app habla con esta interfaz; hoy hay dos implementaciones:
//  · local  → localStorage del navegador (siempre activa, arranque inmediato)
//  · nube   → almacén privado por usuario del alojamiento (ver cloud.ts), si está disponible
// En producción (Fase 2) la implementación «nube» pasa a ser la API propia + base de datos.
export type Slice = 'profile' | 'prefs' | 'wardrobe' | 'saved';
export const SLICES: Slice[] = ['profile', 'prefs', 'wardrobe', 'saved'];
export interface Stored<T = unknown> { data: T; updatedAt: number }

const KEY = (s: string) => `percha:v1:${s}`;

export const local = {
  read<T>(slice: string): Stored<T> | null {
    try {
      const raw = window.localStorage.getItem(KEY(slice));
      return raw ? (JSON.parse(raw) as Stored<T>) : null;
    } catch { return null; }
  },
  write<T>(slice: string, value: Stored<T>): boolean {
    try { window.localStorage.setItem(KEY(slice), JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(slice: string) { try { window.localStorage.removeItem(KEY(slice)); } catch { /* sin almacenamiento */ } },
  available(): boolean {
    try { window.localStorage.setItem(KEY('probe'), '1'); window.localStorage.removeItem(KEY('probe')); return true; } catch { return false; }
  },
};

/** Quita las fotografías antes de enviar nada fuera del dispositivo. */
export function stripPhotos<T>(slice: Slice, data: T): T {
  if (slice === 'profile') return { ...(data as any), photos: [] };
  if (slice === 'wardrobe') return (data as any[]).map(({ photo: _photo, ...rest }) => rest) as T;
  return data;
}
