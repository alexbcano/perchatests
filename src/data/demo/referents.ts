// DATOS DE DEMOSTRACIÓN — Referentes ficticios.
// No representan a personas reales. Esta lista es la «fuente de datos editable»:
// en la app se pueden añadir, editar y borrar referentes (Tendencias → Editar fuente),
// y en producción se sustituye por una tabla `referents` mantenida por el equipo editorial,
// siempre con sourceUrl verificable para cada afirmación.
import type { Referent, WardrobeItem } from '@/domain/types';

export const REFERENTS: Referent[] = [
  { id: 'r01', demo: true, name: 'Lucía Arámburu', handle: '@demo.lucia', country: 'España', language: 'es', content: 'Vídeo corto', styles: ['minimal', 'quiet'], bio: 'Armario cápsula y compras lentas. Enseña a repetir prendas sin repetir look.', signature: ['Tono sobre tono', 'Abrigo largo', 'Pantalón de pinzas'], palette: ['crudo', 'camel', 'gris', 'negro'] },
  { id: 'r02', demo: true, name: 'Iker Zubiri', handle: '@demo.iker', country: 'España', language: 'es', content: 'Fotografía', styles: ['street', 'skater'], bio: 'Calle, skate y segunda mano en Bilbao. Siluetas anchas y capas cortas.', signature: ['Vaquero ancho', 'Sudadera gruesa', 'Zapatilla de ante'], palette: ['negro', 'gris', 'oliva', 'burdeos'] },
  { id: 'r03', demo: true, name: 'Renata Coello', handle: '@demo.renata', country: 'México', language: 'es', content: 'Vídeo largo', styles: ['vintage', 'y2k'], bio: 'Tianguis, archivo y arreglos caseros. Cada vídeo parte de una prenda encontrada.', signature: ['Pana', 'Camisa estampada', 'Gafas estrechas'], palette: ['mostaza', 'marron', 'rosa', 'denim'] },
  { id: 'r04', demo: true, name: 'Tomás Echagüe', handle: '@demo.tomas', country: 'Argentina', language: 'es', content: 'Blog', styles: ['oldmoney', 'smart', 'formal'], bio: 'Sastrería explicada sin solemnidad: hombros, bajos y cómo hablar con un sastre.', signature: ['Americana sin estructura', 'Mocasín', 'Camisa Oxford'], palette: ['marino', 'crudo', 'bosque', 'marron'] },
  { id: 'r05', demo: true, name: 'Valentina Rosero', handle: '@demo.valentina', country: 'Colombia', language: 'es', content: 'Vídeo corto', styles: ['casual', 'smart', 'business'], bio: 'Looks de oficina para clima cálido con presupuesto ajustado.', signature: ['Lino', 'Chino recto', 'Zapatilla lisa'], palette: ['beige', 'blanco', 'azulclaro', 'marino'] },
  { id: 'r06', demo: true, name: 'Nahuel Paine', handle: '@demo.nahuel', country: 'Chile', language: 'es', content: 'Fotografía', styles: ['gorp', 'tech'], bio: 'Del cerro a la ciudad con el mismo equipo. Prueba impermeables bajo lluvia real.', signature: ['Forro polar', 'Chaqueta de tres capas', 'Zapatilla de trail'], palette: ['salvia', 'oliva', 'naranja', 'carbon'] },
  { id: 'r07', demo: true, name: 'Marcus Ellery', handle: '@demo.marcus', country: 'Estados Unidos', language: 'en', content: 'Vídeo largo', styles: ['street', 'tech', 'sporty'], bio: 'Sneaker rotations and layering breakdowns from a tiny apartment closet.', signature: ['Zapatilla voluminosa', 'Cortavientos', 'Cargo'], palette: ['negro', 'plata', 'gris', 'lima'] },
  { id: 'r08', demo: true, name: 'Imogen Hartley', handle: '@demo.imogen', country: 'Reino Unido', language: 'en', content: 'Blog', styles: ['oldmoney', 'vintage', 'quiet'], bio: 'Countryside layers, charity-shop tailoring and how to care for wool.', signature: ['Jersey trenzado', 'Gabardina', 'Bota Chelsea'], palette: ['bosque', 'camel', 'burdeos', 'crudo'] },
  { id: 'r09', demo: true, name: 'Devon Achebe', handle: '@demo.devon', country: 'Canadá', language: 'en', content: 'Vídeo corto', styles: ['minimal', 'smart', 'business'], bio: 'Five-piece work wardrobes and cold-weather commuting fits.', signature: ['Cuello alto', 'Sobrecamisa de lana', 'Abrigo de paño'], palette: ['negro', 'gris', 'carbon', 'marino'] },
  { id: 'r10', demo: true, name: 'Skye Maddern', handle: '@demo.skye', country: 'Australia', language: 'en', content: 'Fotografía', styles: ['y2k', 'skater', 'casual'], bio: 'Beach-town thrift hauls, baggy denim and sun-faded colour.', signature: ['Minifalda vaquera', 'Camiseta corta', 'Zapatilla alta de lona'], palette: ['azulclaro', 'rosa', 'crudo', 'denim'] },
];

/** Prendas de ejemplo para que Mi armario pueda probarse desde el primer momento. */
export const WARDROBE_SEED: WardrobeItem[] = [
  { id: 'w-ej-1', example: true, name: 'Vaquero recto azul', type: 'jeans', brand: '', color: 'denim', seasons: ['primavera', 'verano', 'otono', 'invierno'], addedAt: 0 },
  { id: 'w-ej-2', example: true, name: 'Camiseta blanca lisa', type: 'tee', brand: '', color: 'blanco', seasons: ['primavera', 'verano', 'otono'], addedAt: 0 },
  { id: 'w-ej-3', example: true, name: 'Jersey gris de punto', type: 'knit', brand: '', color: 'gris', seasons: ['otono', 'invierno'], addedAt: 0 },
  { id: 'w-ej-4', example: true, name: 'Zapatillas blancas', type: 'sneaker', brand: '', color: 'blanco', seasons: ['primavera', 'verano', 'otono', 'invierno'], addedAt: 0 },
  { id: 'w-ej-5', example: true, name: 'Abrigo negro', type: 'coat', brand: '', color: 'negro', seasons: ['otono', 'invierno'], addedAt: 0 },
  { id: 'w-ej-6', example: true, name: 'Chino beige', type: 'chino', brand: '', color: 'beige', seasons: ['primavera', 'verano', 'otono'], addedAt: 0 },
];
