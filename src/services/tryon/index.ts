// Probador virtual.
// Fase 1 (implementada): maniquí paramétrico 2D dibujado a partir de las medidas (ui/figure).
// Fase 3 (prevista): servicio externo de virtual try-on sobre fotografía del usuario.
// La interfaz ya está definida para que la UI no cambie al conectar el proveedor.
export interface TryOnRequest { personPhoto: Blob; garmentImageUrls: string[]; view: 'front' | 'side' }
export interface TryOnResult { imageUrl: string; disclaimer: string }

export interface TryOnProvider {
  id: string;
  /** false mientras no haya proveedor configurado: la interfaz lo indica y no simula el resultado. */
  available: boolean;
  render(req: TryOnRequest): Promise<TryOnResult>;
}

export const photoTryOn: TryOnProvider = {
  id: 'none',
  available: false,
  async render() {
    throw new Error('El probador sobre fotografía no está conectado todavía (Fase 3).');
  },
};
