// Lee la ficha de una tienda a partir de su enlace: foto, nombre y tienda.
// El navegador no deja leer páginas de otras webs, así que se usa Microlink (api.microlink.io),
// que lee la página y devuelve sus metadatos. Solo se le envía el enlace de la tienda.
// Plan gratis sin cuenta: unas 25 consultas al día, por eso cada resultado se guarda y no se repite.

export interface Preview { title?: string; image?: string; publisher?: string; description?: string }
export type PreviewError = 'limit' | 'blocked' | 'network' | 'nodata';
export type PreviewResult = { ok: true; preview: Preview; cached: boolean } | { ok: false; error: PreviewError };

const CACHE_KEY = 'percha:v1:previews';
const ENDPOINT = 'https://api.microlink.io/';

function readCache(): Record<string, Preview & { at: number }> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCache(url: string, p: Preview) {
  try {
    const c = readCache();
    c[url] = { ...p, at: Date.now() };
    // Se guardan como mucho 300 enlaces: los más antiguos salen primero.
    const keys = Object.keys(c).sort((a, b) => c[a].at - c[b].at);
    while (keys.length > 300) delete c[keys.shift()!];
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch { /* sin almacenamiento: no pasa nada, solo no se guarda */ }
}

export async function fetchPreview(url: string, signal?: AbortSignal): Promise<PreviewResult> {
  const hit = readCache()[url];
  if (hit && (hit.image || hit.title)) return { ok: true, preview: hit, cached: true };
  const q = new URLSearchParams({ url, palette: 'false', audio: 'false', video: 'false', iframe: 'false' });
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  signal?.addEventListener('abort', () => ctl.abort());
  try {
    const res = await fetch(`${ENDPOINT}?${q}`, { signal: ctl.signal });
    if (res.status === 429) return { ok: false, error: 'limit' };
    const body = await res.json().catch(() => null);
    if (!body || body.status !== 'success' || !body.data) {
      const code = String(body?.code ?? '');
      return { ok: false, error: code === 'ERATE' || code === 'ERATELIMIT' ? 'limit' : 'blocked' };
    }
    const d = body.data;
    const image = typeof d.image?.url === 'string' && /^https?:\/\//.test(d.image.url) ? d.image.url : undefined;
    const preview: Preview = { title: cleanTitle(d.title, d.publisher), image, publisher: d.publisher || undefined, description: d.description || undefined };
    if (!preview.image && !preview.title) return { ok: false, error: 'nodata' };
    writeCache(url, preview);
    return { ok: true, preview, cached: false };
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Quita de los títulos lo que no es el nombre de la prenda: «| Scuffers», «– Milfshakes», «Comprar online…». */
export function cleanTitle(title?: string, publisher?: string): string | undefined {
  if (!title) return undefined;
  let t = title.replace(/\s+/g, ' ').trim();
  t = t.replace(/\s*[|·•–—-]\s*[^|·•–—-]{2,40}$/u, (m) => (publisher && m.toLowerCase().includes(publisher.toLowerCase().slice(0, 4)) ? '' : m.length < 30 ? '' : m));
  t = t.replace(/^(comprar|compra|buy)\s+/i, '').replace(/\s+(online|en línea)$/i, '');
  return t.trim() || undefined;
}

export const PREVIEW_ERROR_TEXT: Record<PreviewError, string> = {
  limit: 'Hoy ya se han hecho muchas consultas al servicio que lee las tiendas. Prueba mañana o sube la foto tú.',
  blocked: 'Esta tienda no deja leer su página. Sube la foto tú o pega la dirección de la imagen.',
  network: 'No se ha podido conectar con el servicio que lee las tiendas. Revisa la conexión y vuelve a probar.',
  nodata: 'La página no trae foto ni nombre que se puedan leer.',
};
