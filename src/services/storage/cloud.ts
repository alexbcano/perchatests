// Sincronización con el almacén privado por usuario del alojamiento (Claude artifacts: capacidad `db`).
// Cada persona escribe solo en data/users/<su id>/…, que nadie más puede leer, ni siquiera quien publica la app.
// Las fotografías no se envían nunca: se quedan en el dispositivo.
import { SLICES, stripPhotos, type Slice, type Stored } from './index';

interface DocRef { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
interface Db { doc(path: string): DocRef }

export interface CloudHandle {
  push(slice: Slice, value: Stored): void;
  wipe(): Promise<void>;
}

export async function connectCloud(
  getLocal: (slice: Slice) => Stored,
  applyRemote: (slice: Slice, value: Stored) => void,
  onStatus: (s: 'cloud' | 'cloud-error') => void,
): Promise<CloudHandle | null> {
  const claude = (window as any).claude;
  if (!claude?.use) return null;
  let db: Db | null = null, uid: string | null = null;
  try {
    const [d, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    db = d; uid = user ? await user.id() : null;
  } catch { return null; }
  if (!db || !uid) return null;
  const ref = (slice: Slice) => db!.doc(`data/users/${uid}/${slice}`);

  const timers: Partial<Record<Slice, number>> = {};
  const pending: Partial<Record<Slice, Stored>> = {};
  const busy: Partial<Record<Slice, boolean>> = {};
  let failed = false;

  async function flush(slice: Slice) {
    if (busy[slice] || failed) return;
    const value = pending[slice];
    if (!value) return;
    delete pending[slice];
    busy[slice] = true;
    try {
      await ref(slice).set({ updatedAt: value.updatedAt, json: JSON.stringify(stripPhotos(slice, value.data)) });
    } catch (err: any) {
      // Sin permiso de escritura (p. ej. visitante de solo lectura): seguimos solo en local.
      failed = true; onStatus('cloud-error');
    } finally {
      busy[slice] = false;
      if (pending[slice]) void flush(slice);
    }
  }

  const handle: CloudHandle = {
    push(slice, value) {
      if (failed) return;
      pending[slice] = value;
      window.clearTimeout(timers[slice]);
      timers[slice] = window.setTimeout(() => void flush(slice), 1200);
    },
    async wipe() {
      for (const s of SLICES) { window.clearTimeout(timers[s]); delete pending[s]; try { await ref(s).delete(); } catch { /* nada que borrar */ } }
    },
  };

  try {
    for (const slice of SLICES) {
      const snap = await ref(slice).get();
      const mine = getLocal(slice);
      const remote = snap.exists ? snap.data() : undefined;
      if (remote && typeof remote.json === 'string' && Number(remote.updatedAt) > mine.updatedAt) {
        applyRemote(slice, { data: JSON.parse(remote.json), updatedAt: Number(remote.updatedAt) });
      } else if (mine.updatedAt > 0 && (!remote || Number(remote.updatedAt) < mine.updatedAt)) {
        handle.push(slice, mine);
      }
    }
    onStatus('cloud');
  } catch {
    onStatus('cloud-error');
    return null;
  }
  return handle;
}
