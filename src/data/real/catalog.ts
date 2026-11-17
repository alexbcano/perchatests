// CATÁLOGO REAL — ropa de hombre leída en las webs de las tiendas el 16 de noviembre de 2026.
// Cada producto lleva el enlace a su ficha y el precio que mostraba la tienda ese día.
// Precio, colores y existencias pueden haber cambiado: el dato vigente es siempre el de la ficha.
// Estilo, temporada, formalidad y color de dibujo son clasificación propia de Percha, no datos de la marca.
import type { ColorKey, Fit, GarmentType, Product, Season, StyleKey } from '@/domain/types';
import { categoryOf } from '@/domain/garments';
import { REAL_BRANDS, REAL_SEEN_AT } from './brands';

const SEASON_CODE: Record<string, Season> = { P: 'primavera', V: 'verano', O: 'otono', I: 'invierno' };
const COS = 'https://www.cos.com/es-es/men/';
const COSIMG = (h: string) => `https://media.cos.com/assets/001/${h}_xxl-1.jpg?imwidth=800`;
const UQ = (id: string, c: string) => `https://www.uniqlo.com/es/es/products/E${id}-000/00?colorDisplayCode=${c}`;
const UQIMG = (id: string, c: string) => `https://image.uniqlo.com/UQ/ST3/eu/imagesgoods/${id}/item/eugoods_${c}_${id}_3x4.jpg`;
const CAMPER = 'https://www.camper.com/es_ES/hombre/zapatos/';
const CAMIMG = (ref: string) => `https://cloud.camper.com/is/image/JGVzaG9wMDNiYWdncmV5JA==/${ref}_L.jpg`;

const UO = (slug: string) => `https://www.urbanoutfitters.com/es-es/shop/${slug}`;
const UOIMG = (ref: string) => `https://imageseu.urbndata.com/is/image/UrbanOutfittersEU/${ref}_b?fit=constrain&hei=800&qlt=80`;
const MS = (slug: string) => `https://milfshakes.es/products/${slug}`;
const MSIMG = (file: string) => `https://milfshakes.es/cdn/shop/files/${file}`;
const MSZ = ['S', 'M', 'L', 'XL', 'XXL'];
const SC = (slug: string) => `https://scuffers.com/products/${slug}`;
const SCZ = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ALPHA = ['XS', 'S', 'M', 'L', 'XL'];
const ALPHA7 = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const EU_T = ['44', '46', '48', '50', '52', '54'];
const SHOE = ['40', '41', '42', '43', '44', '45'];

interface Extra { img?: string; sizes?: string[]; out?: string[]; names?: string[]; traits?: Product['traits']; noChart?: boolean }

function r(
  id: string, name: string, brandId: string, type: GarmentType, color: ColorKey, alts: ColorKey[], price: number,
  fit: Fit, styles: string, seasons: string, lvl: [number, number, number], url: string, x: Extra = {},
): Product {
  const brand = REAL_BRANDS.find((b) => b.id === brandId)!;
  return {
    // Un solo color por producto: el de la foto y el enlace. El resto de colores va en colorNames.
    id, demo: false, name, brandId, category: categoryOf(type), type, color, colors: alts.length < 0 ? alts : [color], price, fit,
    styles: styles.split(' ') as StyleKey[],
    seasons: seasons.split('').map((c) => SEASON_CODE[c]),
    formality: lvl[0], boldness: lvl[1], warmth: lvl[2],
    sizes: (x.sizes ?? []).map((label) => ({ label, inStock: !(x.out ?? []).includes(label) })),
    availability: 'consultar', markets: brand.markets, traits: x.traits, url,
    imageUrl: x.img, seenAt: REAL_SEEN_AT, colorNames: x.names, noChart: x.noChart,
  };
}

export const REAL_CATALOG: Product[] = [
  // ── COS · partes de arriba ───────────────────────────────────────
  r('c01', 'Camiseta canalé algodón slim fit', 'cos', 'tee', 'blanco', ['negro', 'grisclaro', 'marino', 'carbon', 'marron'], 35, 'slim', 'minimal quiet smart casual street', 'PVOI', [2, 1, 1], COS + 'menswear/tshirts/slim-fit/product/slim-ribbed-t-shirt-white-1229297001', { img: COSIMG('6a/8d/6a8db7be0a086b09d62113ba2c994fc9387c8099'), sizes: ALPHA, names: ['Blanco', 'Negro', 'Gris claro', 'Azul marino', 'Gris marengo', 'Marrón'] }),
  r('c02', 'Camiseta algodón manga larga relaxed fit', 'cos', 'longsleeve', 'chocolate', [], 45, 'relaxed', 'casual vintage skater street', 'PO', [2, 3, 2], COS + 'menswear/tshirts/relaxed-fit/product/relaxed-jersey-interlock-long-sleeved-t-shirt-chocolate-cobalt-striped-1261873028', { names: ['Chocolate / cobalto / rayas'], traits: { pattern: 'stripes', second: 'azul' } }),
  r('c03', 'Camiseta henley ajustada algodón manga larga', 'cos', 'longsleeve', 'negro', [], 45, 'slim', 'minimal casual smart vintage', 'POI', [2, 1, 2], COS + 'menswear/tshirts/slim-fit/product/slim-ribbed-cotton-long-sleeved-henley-t-shirt-black-1333150005', { names: ['Negro'] }),
  r('c04', 'Camiseta cuello alto lana slim fit', 'cos', 'turtleneck', 'marron', [], 59, 'slim', 'minimal quiet smart formal business', 'OI', [4, 2, 3], COS + 'menswear/knitwear/jumpers/wool/product/slim-wool-jersey-roll-neck-top-coffee-mlange-1264072008', { names: ['Café jaspeado'] }),
  r('c05', 'Jersey lana merino hervida cuello redondo', 'cos', 'knit', 'lila', ['carbon', 'negro', 'azul'], 99, 'relaxed', 'minimal quiet smart casual business', 'OI', [3, 2, 4], COS + 'menswear/knitwear/jumpers/merino/product/boiled-merino-wool-crew-neck-jumper-mauve-1338797004', { img: COSIMG('63/16/63169182d4d67ead42e6a2c5f09ad58710067749'), sizes: ALPHA, names: ['Malva', 'Gris marengo', 'Negro', 'Azul'] }),
  r('c06', 'Polo lana cepillada', 'cos', 'polo', 'crudo', [], 89, 'regular', 'oldmoney quiet smart business minimal', 'OI', [3, 2, 3], COS + 'menswear/knitwear/jumpers/product/brushed-wool-polo-shirt-ivory-1302327004', { names: ['Marfil'] }),
  r('c07', 'Camisa oxford algodón', 'cos', 'shirt', 'salvia', ['blanco', 'azulclaro', 'burdeos'], 70, 'relaxed', 'oldmoney business smart casual formal', 'PVOI', [4, 2, 2], COS + 'menswear/shirts/cottonshirts/product/cotton-oxford-shirt-green-white-striped-1307720018', { img: COSIMG('eb/b7/ebb72fc826c6038ae6eed079fb7044652cb38377'), sizes: ALPHA, names: ['Verde / blanco / rayas', 'Blanco', 'Azul claro', 'Rojo vino', 'Azul / rayas'] }),
  r('c08', 'Camisa popelina algodón pima relaxed fit', 'cos', 'shirt', 'rojo', [], 59, 'relaxed', 'minimal smart casual street', 'PVO', [3, 4, 1], COS + 'menswear/shirts/cottonshirts/product/relaxed-pima-cotton-poplin-shirt-red-1289730033', { names: ['Rojo'] }),
  r('c09', 'Sudadera efecto neopreno corte relajado', 'cos', 'sweatshirt', 'gris', ['negro'], 79, 'relaxed', 'street minimal casual sporty skater', 'POI', [1, 2, 3], COS + 'menswear/sweatshirts/product/relaxed-scuba-sweatshirt-grey-mlange-1373692001', { img: COSIMG('ac/45/ac45fb359e453cb651d68004af2ef69f5c300251'), sizes: ALPHA, names: ['Gris jaspeado', 'Negro'] }),
  r('c10', 'Jersey lana cuello polo cremallera', 'cos', 'knit', 'marino', ['oliva', 'crudo'], 99, 'relaxed', 'smart casual quiet gorp business', 'OI', [3, 2, 4], COS + 'menswear/knitwear/jumpers/product/boiled-wool-zip-up-polo-jumper-navy-1300669001', { img: COSIMG('c6/b0/c6b0d14a6c7d1f2558367220cdabf72c0b7f43ad'), sizes: ALPHA, out: ['M', 'L', 'XL'], names: ['Azul marino', 'Caqui', 'Blanco roto'] }),
  r('c11', 'Camisa punto lana merino', 'cos', 'shirt', 'burdeos', [], 79, 'regular', 'quiet smart oldmoney vintage', 'OI', [3, 3, 3], COS + 'menswear/shirts/casualshirts/product/knitted-merino-wool-shirt-bordeaux-1327611010', { names: ['Burdeos'] }),
  // ── COS · capas ──────────────────────────────────────────────────
  r('c20', 'Abrigo largo mezcla lana doble faz', 'cos', 'coat', 'camel', ['marino'], 349, 'relaxed', 'minimal quiet oldmoney formal smart business', 'OI', [4, 2, 5], COS + 'menswear/coatsjackets/wool/product/double-faced-wool-blend-long-coat-camel-1340996002', { img: COSIMG('23/83/2383114b58a41b38224edb04b2e22c14ccff9bb0'), sizes: ALPHA, names: ['Camel', 'Azul marino'] }),
  r('c21', 'Gabardina reversible estampado cuadros', 'cos', 'trench', 'beige', [], 199, 'regular', 'oldmoney vintage smart business', 'PO', [4, 3, 3], COS + 'menswear/coatsjackets/coats/product/reversible-checked-car-coat-beige-checked-1341955001', { names: ['Beige a cuadros'], traits: { pattern: 'check', second: 'marron' } }),
  r('c22', 'Sobrecamisa lana doble faz', 'cos', 'overshirt', 'negro', ['lila'], 149, 'relaxed', 'minimal smart quiet business casual street', 'OI', [3, 1, 4], COS + 'menswear/shirts/overshirts/product/split-wool-overshirt-black-1304465001', { img: COSIMG('ce/3c/ce3cff3fa12ae8059c3f8d3ceecad7d1c07c1e20'), sizes: ALPHA, names: ['Negro', 'Malva', 'Azul marino a cuadros'] }),
  r('c23', 'Cazadora bomber acolchada cuello alto', 'cos', 'bomber', 'marino', ['burdeos'], 179, 'relaxed', 'street minimal casual smart tech', 'OI', [2, 2, 4], COS + 'menswear/coatsjackets/bomberjackets/product/padded-funnel-neck-bomber-jacket-navy-1341010002', { img: COSIMG('cc/98/cc985ad07e71390827f3f36245e936f596c001f7'), sizes: ALPHA, names: ['Azul marino', 'Burdeos'] }),
  r('c24', 'Cazadora bomber vaquera', 'cos', 'denimjacket', 'carbon', [], 149, 'regular', 'street vintage casual skater', 'PO', [2, 2, 2], COS + 'menswear/coatsjackets/bomberjackets/product/denim-bomber-jacket-slate-1340985001', { names: ['Pizarra'] }),
  r('c25', 'Chaqueta técnica nailon corta', 'cos', 'shell', 'chocolate', [], 149, 'regular', 'tech gorp minimal street', 'PO', [2, 2, 3], COS + 'menswear/coatsjackets/coats/product/technical-nylon-short-trench-jacket-dark-brown-1340986001', { names: ['Marrón oscuro'] }),
  r('c26', 'Plumífero nailon plumón cuello alto', 'cos', 'puffer', 'marino', ['marron'], 199, 'relaxed', 'street minimal casual tech gorp', 'I', [1, 2, 5], COS + 'menswear/coatsjackets/jackets/product/funnel-neck-nylon-down-puffer-jacket-navy-1336464001', { img: COSIMG('78/a8/78a87f1ff3005aeb7201ddfe5df5a070ef76804b'), sizes: ALPHA, names: ['Azul marino', 'Marrón grisáceo'] }),
  r('c27', 'Cárdigan texturizado con cuello', 'cos', 'cardigan', 'gris', ['marron'], 129, 'regular', 'minimal quiet casual vintage smart oldmoney', 'OI', [3, 2, 4], COS + 'menswear/knitwear/cardigans/product/textured-collared-cardigan-grey-mlange-1358619001', { names: ['Gris jaspeado', 'Café jaspeado'] }),
  // ── COS · partes de abajo ────────────────────────────────────────
  r('c30', 'Pantalón pinzas wide leg relaxed fit algodón', 'cos', 'wide', 'negro', ['marino'], 99, 'relaxed', 'minimal quiet smart street business', 'PVOI', [4, 2, 2], COS + 'menswear/trousers/relaxed-fit/wideleg/product/wide-leg-pleated-cotton-trousers-black-1294676004', { img: COSIMG('25/46/2546cbd550ba3e38974474ad12fa230527c17d71'), sizes: EU_T, names: ['Negro', 'Azul oscuro'] }),
  r('c31', 'Chinos wide leg relaxed fit algodón', 'cos', 'chino', 'negro', ['beige', 'chocolate'], 79, 'relaxed', 'casual smart street minimal skater', 'PVOI', [3, 1, 2], COS + 'menswear/trousers/relaxed-fit/wideleg/product/cotton-relaxed-fit-wide-leg-chinos-black-1285684004', { img: COSIMG('e3/ef/e3ef691b555208e24b5e13d22ae8c363f1bfe105'), sizes: EU_T, names: ['Negro', 'Beige', 'Marrón oscuro'] }),
  r('c32', 'Pantalón recto relaxed fit en twill algodón', 'cos', 'straight', 'marino', ['beige'], 89, 'relaxed', 'casual smart business minimal oldmoney', 'PVOI', [3, 1, 2], COS + 'menswear/trousers/relaxed-fit/straightleg/product/cotton-twill-relaxed-fit-straight-leg-trousers-navy-1351173001', { names: ['Azul marino', 'Beige'] }),
  r('c33', 'Pantalón wide leg lana doble faz relaxed fit', 'cos', 'wide', 'carbon', ['chocolate'], 149, 'relaxed', 'minimal quiet formal business smart oldmoney', 'OI', [4, 2, 4], COS + 'menswear/trousers/relaxed-fit/wideleg/product/double-faced-wool-relaxed-fit-wide-leg-trousers-charcoal-1342991002', { img: COSIMG('64/fb/64fbc40db596939441f955953e9a59621948e79f'), sizes: EU_T, names: ['Gris marengo', 'Marrón oscuro'] }),
  r('c34', 'Pantalón pana wide leg relaxed fit cinturón', 'cos', 'wide', 'carbon', [], 129, 'relaxed', 'vintage minimal casual street skater', 'OI', [3, 2, 3], COS + 'menswear/trousers/relaxed-fit/wideleg/product/belt-detail-corduroy-relaxed-fit-wide-leg-trousers-charcoal-1354349001', { names: ['Gris marengo'] }),
  r('c35', 'Pantalón pana relaxed fit tapered leg', 'cos', 'straight', 'carbon', ['marino'], 89, 'relaxed', 'vintage casual smart gorp', 'OI', [3, 1, 3], COS + 'menswear/trousers/relaxed-fit/taperedleg/product/corduroy-relaxed-fit-tapered-trousers-dark-grey-1353408002', { names: ['Gris oscuro', 'Azul marino'] }),
  r('c36', 'Signature, vaqueros regular fit straight leg', 'cos', 'jeans', 'beige', [], 90, 'regular', 'casual minimal smart vintage', 'PVOI', [2, 1, 2], COS + 'menswear/jeans/regular-fit/product/signature-regular-fit-straight-leg-jeans-beige-1232254027', { names: ['Beige'], noChart: true }),
  r('c37', 'Fold, vaqueros wide leg loose fit', 'cos', 'jeans', 'denim', ['crudo', 'negro'], 99, 'oversized', 'street skater y2k casual', 'PVOI', [1, 3, 2], COS + 'menswear/jeans/wideleg/product/fold-relaxed-fit-wide-leg-jeans-blue-1345749001', { img: COSIMG('30/cd/30cd0f4ab61f708ce75a75ab84652560c8bb5b52'), sizes: ['28', '29', '30', '31', '32', '33', '34'], names: ['Azul', 'Hueso', 'Negro desteñido', 'Azul desgastado'], noChart: true }),
  r('c38', 'Vaqueros slim fit straight leg', 'cos', 'jeans', 'denimoscuro', [], 79, 'slim', 'casual smart minimal business', 'PVOI', [3, 1, 2], COS + 'menswear/jeans/slim-fit/product/slim-fit-straight-leg-jeans-dark-blue-1326832002', { names: ['Azul oscuro'], noChart: true }),
  r('c39', 'Rider, vaqueros straight leg relaxed fit', 'cos', 'jeans', 'negro', [], 99, 'relaxed', 'street casual minimal tech skater', 'PVOI', [2, 2, 2], COS + 'menswear/jeans/relaxed-fit/product/rider-straight-leg-jeans-washed-black-1303189001', { names: ['Negro lavado'], noChart: true }),
  // ── COS · calzado ────────────────────────────────────────────────
  r('c40', 'Zapatillas piel minimalistas', 'cos', 'sneaker', 'crudo', ['negro'], 129, 'regular', 'minimal quiet smart casual business oldmoney', 'PVOI', [3, 1, 2], COS + 'accessories/shoes/sneakers/product/minimal-leather-trainers-light-beige-1327849002', { img: COSIMG('4d/ff/4dff4f967e8d11ee21b698f2cde4da16a9f1f414'), sizes: SHOE, names: ['Beige claro', 'Negro'] }),
  r('c41', 'Zapatillas lona', 'cos', 'skate', 'blanco', [], 79, 'regular', 'casual vintage skater street minimal', 'PVO', [1, 1, 1], COS + 'accessories/shoes/sneakers/product/canvas-plimsoll-trainers-white-1347436001', { names: ['Blanco'] }),
  r('c42', 'Botas chelsea piel', 'cos', 'boot', 'negro', ['marron'], 199, 'regular', 'smart minimal quiet business oldmoney street', 'OI', [4, 2, 4], COS + 'accessories/shoes/boots/product/leather-chelsea-boots-black-1358049001', { img: COSIMG('c8/ac/c8acf1fe01d632c044ff30ddf445c3d482791492'), sizes: SHOE, names: ['Negro', 'Marrón'] }),
  r('c43', 'Mocasines penny piel', 'cos', 'loafer', 'negro', ['marron'], 149, 'regular', 'oldmoney smart business formal quiet vintage', 'PVOI', [4, 2, 2], COS + 'accessories/shoes/formal/product/leather-penny-loafers-black-1358390002', { img: COSIMG('3d/dc/3ddc7d9890ef3a9f47761bf8d310a51fadbf4cdb'), sizes: SHOE, names: ['Negro', 'Marrón'] }),
  r('c44', 'Zapatos derby piel con puntera cuadrada', 'cos', 'derby', 'negro', [], 179, 'regular', 'formal business minimal quiet smart', 'PVOI', [5, 2, 2], COS + 'accessories/shoes/derbyshoes/product/square-toe-leather-derby-shoes-black-1358047001', { names: ['Negro'] }),
  // ── COS · accesorios ─────────────────────────────────────────────
  r('c50', 'Gorro beanie lana canalé grueso', 'cos', 'beanie', 'mostaza', ['gris', 'marino'], 49, 'regular', 'street skater casual gorp minimal tech vintage', 'OI', [1, 2, 4], COS + 'accessories/hatsscarvesgloves/hats/product/chunky-ribbed-wool-beanie-honey-1362060002', { img: COSIMG('f9/38/f938ce5f41b12592c9b5e9c1d67bb6e990e4ada3'), names: ['Miel', 'Gris jaspeado', 'Azul marino'] }),
  r('c51', 'Cinturón piel hebilla cuadrada', 'cos', 'belt', 'negro', ['marron'], 59, 'regular', 'oldmoney formal business smart quiet minimal casual', 'PVOI', [4, 1, 1], COS + 'accessories/belts/product/square-buckle-leather-belt-black-1338172001', { names: ['Negro', 'Marrón'] }),
  r('c52', 'Bufanda cashmere', 'cos', 'scarf', 'carbon', ['marron'], 59, 'regular', 'oldmoney minimal quiet smart business formal casual vintage', 'OI', [3, 1, 5], COS + 'accessories/hatsscarvesgloves/scarves/cashmere/product/cashmere-pull-through-scarf-charcoal-mlange-1373940001', { names: ['Gris marengo jaspeado', 'Café jaspeado'] }),
  r('c53', 'Bolso bandolera correas nailon', 'cos', 'crossbody', 'beige', ['marron'], 49, 'regular', 'tech gorp street casual minimal sporty', 'PVOI', [1, 2, 1], COS + 'accessories/bagswallets/crossbodybags/product/webbing-detail-crossbody-bag-nylon-beige-1362469001', { names: ['Beige', 'Marrón'] }),
  r('c54', 'Bolso tote nailon', 'cos', 'tote', 'marino', [], 89, 'regular', 'minimal casual smart business street', 'PVOI', [2, 1, 1], COS + 'accessories/bagswallets/totebags/product/webbing-detail-tote-bag-nylon-navy-1357380001', { names: ['Azul marino'] }),

  // ── UNIQLO ───────────────────────────────────────────────────────
  r('u01', 'Jersey 100% merino cuello redondo', 'uniqlo', 'knit', 'gris', ['negro', 'rojo', 'chocolate', 'oliva', 'azul', 'marino'], 39.9, 'regular', 'casual minimal smart business quiet oldmoney', 'OI', [3, 1, 3], UQ('450535', '07'), { img: UQIMG('450535', '07'), sizes: ALPHA7, names: ['Gris', 'Negro', 'Rojo', 'Marrón oscuro', 'Verde oliva', 'Azul', 'Azul marino'] }),
  r('u03', 'Cárdigan 100% lana cuello pico', 'uniqlo', 'cardigan', 'gris', [], 49.9, 'regular', 'casual vintage oldmoney smart minimal', 'OI', [3, 1, 3], UQ('488760', '07')),
  r('u05', 'Parka plumas sin costuras', 'uniqlo', 'puffer', 'chocolate', ['gris', 'negro', 'marino'], 149.9, 'regular', 'gorp tech casual street sporty', 'I', [1, 2, 5], UQ('486176', '38'), { img: UQIMG('486176', '38'), sizes: ALPHA7, names: ['Marrón oscuro', 'Gris', 'Negro', 'Azul marino'] }),
  r('u06', 'BLOCKTECH Parka', 'uniqlo', 'shell', 'marino', [], 79.9, 'regular', 'tech gorp sporty casual', 'POI', [1, 2, 3], UQ('488824', '69')),
  r('u07', 'Chaqueta bomber', 'uniqlo', 'bomber', 'chocolate', ['negro', 'oliva'], 79.9, 'relaxed', 'street skater casual vintage y2k', 'PO', [2, 2, 3], UQ('491292', '39'), { img: UQIMG('491292', '39'), sizes: ALPHA7, names: ['Marrón oscuro', 'Negro', 'Verde oliva'] }),
  r('u08', 'PUFFERTECH Chaleco', 'uniqlo', 'gilet', 'negro', [], 49.9, 'regular', 'gorp sporty casual business tech oldmoney', 'OI', [2, 2, 3], UQ('487348', '09')),
  r('u09', 'Chaqueta polar forrada', 'uniqlo', 'sweatshirt', 'beige', [], 49.9, 'regular', 'gorp sporty casual vintage', 'OI', [1, 2, 5], UQ('488747', '32')),
  r('u10', 'Chaqueta cortavientos cuello alto', 'uniqlo', 'shell', 'bosque', [], 59.9, 'regular', 'tech sporty gorp street y2k', 'PO', [1, 3, 2], UQ('486167', '55')),
  r('u11', 'Pantalón jogger', 'uniqlo', 'jogger', 'marino', [], 34.9, 'regular', 'sporty casual street', 'POI', [1, 1, 3], UQ('486120', '69')),
  r('u12', 'Pantalón ancho de felpa', 'uniqlo', 'wide', 'marino', [], 39.9, 'relaxed', 'sporty street casual skater', 'POI', [1, 2, 3], UQ('471809', '69')),
  r('u13', 'AIRism Camiseta algodón cuello redondo', 'uniqlo', 'tee', 'rojo', [], 24.9, 'relaxed', 'street skater casual sporty y2k', 'PVO', [1, 3, 1], UQ('465193', '16')),
  r('u14', 'HEATTECH Camiseta térmica cuello redondo', 'uniqlo', 'longsleeve', 'negro', [], 14.9, 'slim', 'tech gorp sporty casual', 'OI', [1, 1, 3], UQ('461003', '09')),
  r('u15', 'Camiseta suave cuello alto', 'uniqlo', 'turtleneck', 'carbon', [], 24.9, 'slim', 'minimal smart casual quiet tech', 'OI', [3, 1, 3], UQ('486129', '08')),
  r('u16', 'Vaquero baggy', 'uniqlo', 'jeans', 'denim', ['carbon', 'negro'], 49.9, 'oversized', 'street skater y2k casual vintage', 'PVOI', [1, 3, 2], UQ('482868', '62'), { img: UQIMG('482868', '62'), sizes: ['28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40'], names: ['Azul', 'Gris oscuro', 'Negro'] }),
  r('u17', 'Pantalón ancho pinzas', 'uniqlo', 'wide', 'marino', ['gris', 'negro', 'beige', 'chocolate'], 49.9, 'relaxed', 'minimal smart casual street business quiet', 'PVOI', [3, 2, 2], UQ('462197', '69'), { img: UQIMG('462197', '69'), sizes: ALPHA7, names: ['Azul marino', 'Gris', 'Negro', 'Beige', 'Marrón oscuro'] }),
  r('u18', 'Pantalón cargo', 'uniqlo', 'cargo', 'negro', ['oliva', 'beige'], 39.9, 'relaxed', 'street tech gorp skater casual', 'PVOI', [1, 3, 2], UQ('492366', '09'), { img: UQIMG('492366', '09'), sizes: ALPHA7, names: ['Negro', 'Verde oliva', 'Beige'] }),
  r('u19', 'Pantalón cálido elástico', 'uniqlo', 'straight', 'beige', [], 49.9, 'regular', 'gorp tech casual sporty', 'OI', [2, 1, 4], UQ('479372', '32')),
  r('u20', 'Camisa oxford rayas', 'uniqlo', 'shirt', 'azul', [], 39.9, 'regular', 'oldmoney business smart casual', 'PVOI', [4, 2, 2], UQ('452298', '65')),
  r('u21', 'Camisa franela cuadros', 'uniqlo', 'shirt', 'mostaza', [], 39.9, 'regular', 'vintage skater gorp casual street', 'OI', [2, 3, 3], UQ('486595', '46'), { traits: { pattern: 'check', second: 'negro' } }),
  r('u22', 'Camisa oxford oversize', 'uniqlo', 'shirt', 'blanco', [], 29.9, 'oversized', 'street casual minimal skater', 'PVOI', [3, 2, 2], UQ('484244', '00')),
  r('u23', 'Gorro punto', 'uniqlo', 'beanie', 'negro', [], 19.9, 'regular', 'street skater casual gorp tech minimal sporty', 'OI', [1, 1, 4], UQ('486196', '09')),
  r('u24', 'Gorra', 'uniqlo', 'cap', 'negro', [], 19.9, 'regular', 'street skater casual sporty y2k gorp', 'PVO', [1, 2, 1], UQ('486194', '09')),

  // ── Camper ───────────────────────────────────────────────────────
  r('k01', 'Runner, zapatillas blancas de piel y nobuk', 'camper', 'sneaker', 'blanco', [], 110, 'regular', 'casual minimal smart street sporty', 'PVOI', [2, 1, 2], CAMPER + 'runner/camper-runner-K101052-003', { img: CAMIMG('K101052-003'), names: ['Blanco'] }),
  r('k02', 'Twins, zapatillas blancas de piel', 'camper', 'sneaker', 'blanco', [], 135, 'regular', 'casual minimal smart quiet business', 'PVOI', [3, 2, 2], CAMPER + 'twins/camper-twins-K101129-003', { img: CAMIMG('K101129-003'), names: ['Blanco'] }),
  r('k03', 'Drift Trail, zapatillas de piel blancas', 'camper', 'trail', 'blanco', [], 170, 'regular', 'gorp tech street sporty', 'PVOI', [1, 3, 2], CAMPER + 'ada/camper-drift_trail_vibram-K100928-001', { img: CAMIMG('K100928-001'), names: ['Blanco'] }),
  r('k04', 'Runner Twentyfive, zapatillas de piel blancas', 'camper', 'runner', 'blanco', [], 140, 'regular', 'sporty vintage casual street', 'PVOI', [1, 2, 2], CAMPER + 'runner/camper-runner_twentyfive-K101105-009', { img: CAMIMG('K101105-009'), names: ['Blanco'] }),
  r('k05', 'Dean, zapatos de piel negros', 'camper', 'derby', 'negro', [], 160, 'regular', 'formal business smart minimal quiet oldmoney', 'PVOI', [4, 1, 2], CAMPER + 'dea/camper-dean-K100979-001', { img: CAMIMG('K100979-001'), names: ['Negro'] }),
  r('k06', 'Alaro, botines de piel negros', 'camper', 'boot', 'negro', [], 240, 'regular', 'smart minimal street tech business', 'OI', [3, 2, 4], CAMPER + 'alo/camper-alaro-K300553-002', { img: CAMIMG('K300553-002'), names: ['Negro'] }),
  r('k07', 'Pix Berlin, botines de nobuk negros', 'camper', 'boot', 'negro', [], 220, 'regular', 'street tech gorp vintage', 'OI', [2, 3, 4], CAMPER + 'pix/camper-pix_berlin-K300525-004', { img: CAMIMG('K300525-004'), names: ['Negro'], traits: { high: true } }),
  r('k08', 'Norman, zapatos de ante grises', 'camper', 'derby', 'gris', [], 150, 'regular', 'smart casual oldmoney vintage business', 'PVO', [3, 2, 2], CAMPER + 'rtf/camper-norman-K100999-005', { img: CAMIMG('K100999-005'), names: ['Gris'] }),

  // ── New Balance, Levi's, Carhartt WIP, Massimo Dutti ─────────────
  r('n01', '574 Core', 'newbalance', 'runner', 'burdeos', [], 120, 'regular', 'sporty vintage casual street skater', 'PVOI', [1, 3, 2], 'https://www.newbalance.es/es/pd/574-core/ML574V3-40377.html', { img: 'https://nb.scene7.com/is/image/NB/ml574evg_nb_02_i?$pdpflexf2$&wid=440&hei=440', names: ['Burgundy with White'] }),
  r('n02', '574', 'newbalance', 'runner', 'crudo', [], 120, 'regular', 'sporty vintage casual street minimal', 'PVOI', [1, 2, 2], 'https://www.newbalance.es/es/pd/574/U574V2_LI-FTW-825977.html', { img: 'https://nb.scene7.com/is/image/NB/u5746sg_nb_02_i?$pdpflexf2$&wid=440&hei=440', names: ['Sea Salt with Linen'] }),
  r('n03', 'NB Numeric 574 Vulc', 'newbalance', 'skate', 'negro', [], 100, 'regular', 'skater street casual', 'PVOI', [1, 2, 2], 'https://www.newbalance.es/es/pd/nb-numeric-574-vulc/UN574V1_SK-FTW-803144.html', { names: ['Black with Sea Salt'] }),
  r('v01', "Jean 501 Levi's Original", 'levis', 'jeans', 'denim', [], 110, 'regular', 'casual vintage street skater smart', 'PVOI', [2, 1, 2], 'https://www.levi.com/ES/es_ES/ropa/hombre/vaqueros/jean-501-levis-original/p/005012744', { names: ['Azul'] }),
  r('w01', 'Double Knee Pant', 'carhartt', 'straight', 'negro', [], 129, 'relaxed', 'street skater vintage casual', 'PVOI', [1, 3, 2], 'https://www.carhartt-wip.com/es-es/p/double-knee-pant-black-rinsed-1313', { sizes: ['26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40'], names: ['Black, rinsed'], noChart: true }),
  r('d01', 'Americana traje 100% lana', 'dutti', 'blazer', 'marino', [], 199, 'regular', 'formal business smart oldmoney quiet', 'POI', [5, 1, 3], 'https://www.massimodutti.com/es/americana-traje-100-lana-l03671558', { img: 'https://static.massimodutti.net/assets/public/ea8b/3007/edaa44389e41/8dcba3c8e905/03671558401-t/03671558401-t.jpg?ts=1777473026212', names: ['Azul marino'] }),
  // ── Añadidos el 16 nov 2026 (segunda tanda) ──────────────────────
  r('c12', 'Camiseta algodón regular fit', 'cos', 'tee', 'blanco', [], 25, 'regular', 'casual minimal street smart skater sporty', 'PVOI', [2, 1, 1], COS + 'menswear/tshirts/regular-fit/product/regular-fit-cotton-t-shirt-white-1334757002', { img: COSIMG('f6/fa/f6fafe72c24599aec647754678b0ce8a1d0bb59c'), sizes: ALPHA, names: ['Blanco'] }),
  r('c13', 'Camiseta algodón regular fit', 'cos', 'tee', 'negro', [], 25, 'regular', 'casual minimal street tech skater sporty', 'PVOI', [2, 1, 1], COS + 'menswear/tshirts/regular-fit/product/regular-fit-cotton-t-shirt-black-1334757003', { img: COSIMG('ae/7b/ae7b5da5b81f89fb2c36baa611593892b5ad5bda'), sizes: ALPHA, names: ['Negro'] }),
  r('c14', 'Camiseta algodón cuello redondo relaxed fit', 'cos', 'tee', 'blanco', [], 40, 'relaxed', 'street skater casual minimal y2k', 'PVOI', [1, 1, 1], COS + 'menswear/tshirts/relaxed-fit/product/interlock-cotton-crew-neck-t-shirt-white-1283191026', { img: COSIMG('ad/e5/ade5f65e7bc6944e987fa7aa22e667ad3731c201'), sizes: ALPHA, names: ['Blanco'] }),
  r('c15', 'Camiseta algodón manga larga relaxed fit', 'cos', 'longsleeve', 'negro', [], 45, 'relaxed', 'street skater casual minimal tech', 'POI', [1, 1, 2], COS + 'menswear/tshirts/relaxed-fit/product/interlock-jersey-long-sleeved-t-shirt-black-1261873002', { img: COSIMG('e0/45/e0455c20b0e784f0e52186707bbe2a246d0903c2'), sizes: ALPHA, names: ['Negro'] }),
  r('c16', 'Sudadera capucha neopreno oversize cremallera', 'cos', 'hoodie', 'marron', [], 99, 'oversized', 'street skater casual sporty tech', 'POI', [1, 2, 4], COS + 'menswear/hoodies/product/oversized-scuba-jersey-zip-up-hoodie-brown-mlange-1260774005', { img: COSIMG('de/4a/de4a652df6f9f0a94787ae3ff6df4dbc592672ba'), sizes: ALPHA, names: ['Marrón jaspeado'] }),
  r('c17', 'Sudadera algodón lavado', 'cos', 'sweatshirt', 'marino', [], 59, 'regular', 'casual vintage street skater sporty', 'POI', [1, 1, 3], COS + 'menswear/knitwear/jumpers/product/washed-cotton-sweatshirt-navy-1316481004', { img: COSIMG('98/4d/984d6c76a8d97825eecbbeb95fba3069d7f72564'), sizes: ALPHA, names: ['Azul marino'] }),
  r('c18', 'Sudadera capucha punto algodón lavado', 'cos', 'hoodie', 'azul', [], 69, 'relaxed', 'street skater casual sporty vintage', 'POI', [1, 2, 4], COS + 'menswear/hoodies/product/washed-cotton-jersey-hoodie-blue-1248313001', { img: COSIMG('eb/cd/ebcd4721a8f73d427106d691d460a0517e7eaf45'), sizes: ALPHA, out: ['M', 'L', 'XL'], names: ['Azul'] }),
  r('c60', 'Polo efecto neopreno', 'cos', 'polo', 'blanco', [], 69, 'regular', 'sporty casual smart minimal', 'PVO', [2, 1, 1], COS + 'menswear/poloshirts/shortsleeves/product/scuba-jersey-polo-shirt-white-1350235002', { img: COSIMG('f2/64/f264e2a73901f202becfcd47a0046b7eefe9be14'), sizes: ALPHA, names: ['Blanco'] }),
  r('c61', 'Polo slim fit lana cuello abierto', 'cos', 'polo', 'burdeos', [], 59, 'slim', 'oldmoney smart quiet vintage business', 'OI', [3, 2, 3], COS + 'menswear/poloshirts/longsleeves/product/slim-wool-jersey-open-collar-polo-shirt-burgundy-1339515002', { img: COSIMG('ac/fa/acfa0be2a686d85c5151ee1eb5cd9614d46f40de'), sizes: ALPHA, names: ['Burdeos'] }),
  r('u25', 'Sudadera polar cortavientos capucha', 'uniqlo', 'hoodie', 'negro', [], 59.9, 'regular', 'street gorp tech sporty casual skater', 'OI', [1, 2, 5], UQ('486116', '09')),
  r('u26', 'Chaqueta cremallera', 'uniqlo', 'bomber', 'chocolate', [], 59.9, 'regular', 'casual street vintage skater', 'PO', [2, 2, 3], UQ('491096', '39')),
  // ── Urban Outfitters (16 nov 2026). La foto sigue el patrón de su web y no está comprobada una a una. ──
  r('o01', 'BDG Jeans Neo Skate azul', 'uo', 'jeans', 'denim', [], 75, 'oversized', 'street skater y2k casual', 'PVOI', [1, 3, 2], UO('bdg-blue-baked-neo-skate-jeans?color=040'), { img: UOIMG('0222593370973_040'), names: ['Azul'], noChart: true }),
  r('o02', 'BDG Jeans Neo Super Baggy Skate', 'uo', 'jeans', 'denim', [], 69, 'oversized', 'street skater y2k', 'PVOI', [1, 4, 2], UO('bdg-neo-super-baggy-skate-jeans?color=770'), { img: UOIMG('0222912140005_770'), noChart: true }),
  r('o04', 'iets frans… Joggers baggy Harri con paneles', 'uo', 'jogger', 'gris', [], 65, 'relaxed', 'street sporty casual skater y2k', 'POI', [1, 3, 3], UO('iets-frans-grey-panelled-harri-baggy-joggers?color=004'), { img: UOIMG('0221347820033_004'), names: ['Gris'] }),
  r('o05', 'iets frans… Pantalón de chándal Sid de ripstop', 'uo', 'jogger', 'negro', [], 79, 'relaxed', 'street tech sporty skater', 'POI', [1, 3, 2], UO('iets-frans-sid-ripstop-baggy-track-pants?color=001'), { img: UOIMG('0221920510116_001'), names: ['Negro'] }),
  r('o06', 'iets frans… Cargo XL holgado', 'uo', 'cargo', 'oliva', [], 79, 'oversized', 'street skater tech gorp y2k', 'PVOI', [1, 4, 2], UO('iets-frans-xl-baggy-cargo-trousers?color=036'), { img: UOIMG('0221920510104_036'), names: ['Caqui'], noChart: true }),
  r('o07', 'UO Pantalón Noa cocoon', 'uo', 'wide', 'negro', [], 75, 'relaxed', 'street minimal smart casual', 'PVOI', [3, 2, 2], UO('uo-black-noa-cocoon-trousers?color=001'), { img: UOIMG('0221643730019_001'), names: ['Negro'], noChart: true }),
  r('o08', 'Loom Pantalón Brook', 'uo', 'straight', 'marino', [], 75, 'relaxed', 'street casual skater vintage', 'PVOI', [2, 2, 2], UO('loom-navy-brook-trousers3?color=041'), { img: UOIMG('0221968930033_041'), names: ['Azul marino'], noChart: true }),
  r('o09', 'iets frans… Sudadera waffle con capucha y cremallera', 'uo', 'hoodie', 'oliva', [], 75, 'relaxed', 'street skater gorp casual', 'POI', [1, 4, 4], UO('iets-frans-camo-zip-through-waffle-hoodie?color=037'), { img: UOIMG('0216347820493_037'), names: ['Camuflaje'] }),
  r('o10', 'Archivis Sudadera X-Ray con capucha y cremallera', 'uo', 'hoodie', 'rojo', [], 75, 'relaxed', 'street skater y2k', 'POI', [1, 5, 4], UO('archivis-red-x-ray-zip-through-hoodie?color=060'), { img: UOIMG('0216347820501_060'), names: ['Rojo'], traits: { pattern: 'graphic', second: 'blanco' } }),
  r('o11', 'iets frans… Sudadera con capucha y aplicación de cuadros', 'uo', 'hoodie', 'rojo', [], 75, 'relaxed', 'street skater vintage y2k', 'POI', [1, 4, 4], UO('iets-frans-red-check-applique-hoodie?color=060'), { img: UOIMG('0216347820513_060'), names: ['Rojo'] }),
  r('o12', 'Archivis Anorak encerado Wader', 'uo', 'shell', 'rojo', [], 115, 'relaxed', 'street gorp tech skater', 'POI', [1, 4, 3], UO('archivis-waxed-wader-anorak?color=060'), { img: UOIMG('0230920510106_060'), names: ['Rojo'] }),
  r('o13', 'Ayker Anorak tonal con fuelle', 'uo', 'shell', 'oliva', [], 95, 'relaxed', 'street gorp tech casual', 'POI', [1, 3, 3], UO('ayker-tonal-bellow-anorak?color=031'), { img: UOIMG('0230920510129_031') }),
  r('o16', 'Ayker Chaqueta acolchada plegable', 'uo', 'puffer', 'marron', [], 99, 'regular', 'street gorp casual tech', 'OI', [1, 2, 5], UO('ayker-packable-puffer-jacket?color=020'), { img: 'https://imageseu.urbndata.com/is/image/UrbanOutfittersEU/0232920510112_020_a2', names: ['Marrón'] }),
  r('o17', 'BDG Camiseta gráfica de manga larga Archive Slub', 'uo', 'longsleeve', 'blanco', [], 49, 'relaxed', 'street skater vintage y2k', 'PO', [1, 4, 2], UO('bdg-archive-long-sleeve-slub-t-shirt?color=010'), { img: UOIMG('0213477790063_010'), names: ['Blanco'], traits: { pattern: 'graphic', second: 'negro' } }),
  r('o18', 'UO Camiseta gráfica Oktoberblessed', 'uo', 'tee', 'rojo', [], 39, 'relaxed', 'street skater y2k vintage', 'PVO', [1, 4, 1], UO('uo-oktoberblessed-graphic-tee?color=060'), { img: UOIMG('0214341180653_060'), names: ['Rojo'], traits: { pattern: 'graphic', second: 'blanco' } }),
  r('o19', 'UO Camiseta con bordado de tigre', 'uo', 'tee', 'naranja', [], 25, 'relaxed', 'street skater y2k casual', 'PVO', [1, 4, 1], UO('uo-tiger-embroidered-t-shirt?color=080'), { img: UOIMG('0214341180638_080'), names: ['Naranja'] }),
  // ── Milfshakes (16 nov 2026). Precios de oferta del día; cambian a menudo. ──
  r('m01', 'Souvenir Tee White', 'milfshakes', 'tee', 'blanco', [], 29.69, 'relaxed', 'street skater y2k casual', 'PVO', [1, 4, 1], MS('souvenir-tee-white'), { img: MSIMG('001_tee_SOUVENIR_white070361.webp?v=1768769930&width=900'), sizes: MSZ, noChart: true, traits: { pattern: 'graphic' } }),
  r('m02', 'Souvenir Tee Pink', 'milfshakes', 'tee', 'rosa', [], 29.69, 'relaxed', 'street skater y2k', 'PVO', [1, 5, 1], MS('souvenir-tee-pink'), { img: MSIMG('C-_Users_user_Desktop_Nueva-carpeta_MILFSHAKES_ECOM_2ND__TIFF_004_tee_SOUVENIR_babypink21.webp?v=1768769930&width=900'), sizes: MSZ, noChart: true, traits: { pattern: 'graphic' } }),
  r('m03', 'Souvenir Tee Blue', 'milfshakes', 'tee', 'azulclaro', [], 29.69, 'relaxed', 'street skater y2k casual', 'PVO', [1, 4, 1], MS('souvenir-tee-2'), { img: MSIMG('004_tee_SOUVENIR_babyblue070421.webp?v=1768769930&width=900'), sizes: MSZ, noChart: true, traits: { pattern: 'graphic' } }),
  r('m04', '*** Hoodie Red', 'milfshakes', 'hoodie', 'rojo', [], 59.69, 'oversized', 'street skater y2k', 'POI', [1, 5, 4], MS('hoodie-red'), { img: MSIMG('ESS000R_hoodie_ASTERISKS_red_2.jpg?v=1792840917&width=900'), sizes: MSZ, noChart: true }),
  r('m05', '*** Hoodie Black', 'milfshakes', 'hoodie', 'negro', [], 59.69, 'oversized', 'street skater y2k casual', 'POI', [1, 3, 4], MS('hoodie-black'), { sizes: MSZ, noChart: true }),
  r('m06', 'Smokey Black Hoodie', 'milfshakes', 'hoodie', 'negro', [], 64.69, 'oversized', 'street skater y2k gorp', 'POI', [1, 4, 4], MS('black-camo-hoodie'), { sizes: MSZ, noChart: true, names: ['Camuflaje negro lavado'] }),
  r('m07', 'Smokey Red Hoodie', 'milfshakes', 'hoodie', 'rojo', [], 64.69, 'oversized', 'street skater y2k', 'POI', [1, 5, 4], MS('red-camo-hoodie'), { sizes: MSZ, noChart: true, names: ['Camuflaje rojo lavado'] }),
  r('m08', 'Stripes Hoodie', 'milfshakes', 'hoodie', 'negro', [], 64.69, 'oversized', 'street skater sporty y2k', 'POI', [1, 4, 4], MS('racing-stripe-hoodie-o-two-stripes-racer-hoodie'), { sizes: MSZ, noChart: true }),
  r('m09', 'Indigo Sweathoodie', 'milfshakes', 'hoodie', 'denim', [], 59.69, 'oversized', 'street skater casual y2k', 'POI', [1, 3, 4], MS('indigo-sweathoodie'), { sizes: MSZ, noChart: true, names: ['Índigo'] }),
  r('m10', 'Black Stone Sweathoodie', 'milfshakes', 'hoodie', 'carbon', [], 59.69, 'oversized', 'street skater casual', 'POI', [1, 3, 4], MS('black-stone-seathoodie'), { sizes: MSZ, noChart: true, names: ['Negro lavado'] }),
  r('m11', 'Sweatpants Indigo', 'milfshakes', 'jogger', 'denim', [], 56.69, 'relaxed', 'street skater casual y2k sporty', 'POI', [1, 3, 3], MS('sweatpants-indigo'), { sizes: MSZ, noChart: true, names: ['Índigo'] }),
  r('m12', 'Sweatpants Black', 'milfshakes', 'jogger', 'negro', [], 54.69, 'relaxed', 'street skater casual sporty', 'POI', [1, 2, 3], MS('sweetpants-black'), { sizes: MSZ, noChart: true }),
  r('m13', 'Three Wheel Tee', 'milfshakes', 'tee', 'blanco', [], 29.69, 'relaxed', 'street skater y2k', 'PVO', [1, 4, 1], MS('transporter-tee'), { sizes: MSZ, noChart: true, names: ['Consulta el color en la tienda'], traits: { pattern: 'graphic' } }),
  r('m14', 'Skeleton Knit Black', 'milfshakes', 'knit', 'negro', [], 74.69, 'relaxed', 'street skater y2k', 'OI', [1, 5, 4], MS('ess804_fw26_knitcrewneck_skeleton_black'), { sizes: MSZ, noChart: true, traits: { pattern: 'graphic', second: 'blanco' } }),
  r('m15', 'MS Black Crewneck', 'milfshakes', 'sweatshirt', 'negro', [], 54.69, 'relaxed', 'street skater casual', 'POI', [1, 3, 4], MS('220-crewneck-black'), { sizes: MSZ, noChart: true }),
  r('m16', 'Cloudy Cream Hoodie (cremallera)', 'milfshakes', 'hoodie', 'crudo', [], 79.69, 'oversized', 'street skater y2k casual', 'POI', [1, 4, 4], MS('milf-clecru'), { sizes: MSZ, noChart: true }),
  // ── Scuffers (16 nov 2026). Su web no deja leer las fotos: se ven con ilustración. ──
  r('s01', 'Original Black Hoodie', 'scuffers', 'hoodie', 'negro', [], 79, 'oversized', 'street skater casual minimal', 'POI', [1, 3, 4], SC('original-black-hoodie'), { sizes: SCZ, noChart: true }),
  r('s02', 'Raw Dark Hoodie', 'scuffers', 'hoodie', 'carbon', [], 79, 'oversized', 'street skater casual vintage', 'POI', [1, 3, 4], SC('raw-dark-hoodie'), { sizes: SCZ, noChart: true, names: ['Negro desteñido'] }),
  r('s03', 'Sign Dark Hoodie', 'scuffers', 'hoodie', 'negro', [], 79, 'oversized', 'street skater y2k casual', 'POI', [1, 4, 4], SC('sign-black-hoodie'), { sizes: SCZ, noChart: true, traits: { pattern: 'graphic', second: 'blanco' } }),
  r('s04', 'Lizzie Black Hoodie', 'scuffers', 'hoodie', 'negro', [], 79, 'oversized', 'street skater vintage y2k', 'POI', [1, 4, 4], SC('lizzie-black-hoodie'), { noChart: true, names: ['Negro lavado con capucha gris'] }),
  r('s05', 'Rawest Dark Navy Hoodie', 'scuffers', 'hoodie', 'negro', [], 82, 'oversized', 'street skater casual minimal', 'OI', [1, 3, 5], SC('rawest-black-hoodie'), { noChart: true }),
];

// Fotos leídas después en cada ficha.
const EXTRA_IMG: Record<string, string> = {
  c02: '2c/53/2c5395d47a824f2b25b451c9d7b37674dd0ac78b', c03: '05/ec/05ecf3bd0d70c0ac490e137a608b53a82128635e', c04: 'b1/35/b135468936c41bc02dd4dd0bd106b39af79989a8',
  c06: 'd9/83/d983e51a49bb5e982d95f33762b5109e3c3d1e2c', c08: '39/88/39881e2025cea5adecc24828d66ab4c855c2750f', c11: '0a/8e/0a8e50fff399382bd8ca5edcca560b05f17f6e67',
  c21: '5f/81/5f815f263457cf79da03b466ee14d53a08c0422b', c24: '21/96/21968512e2e2a12307f5842dd0ee653510df1c53', c25: '76/f3/76f3917660d2599bf0d078e777fe088b7ef6b278',
  c27: 'e8/f0/e8f06aeef781e8ef033c64f5f9f67467df07b848', c32: '68/57/6857d44ed9fb1cb84a5a1eb82ef58eea13ea91ac', c34: 'f2/b8/f2b8f6e25a83afac95772f0817eebf88cd9533d0',
  c35: '55/45/5545a70ad0acd6f96c7fdb6553c1854c70a9f113', c36: 'cf/0b/cf0b604653938c904a786be8f30f15ad87934f17', c38: 'c0/d4/c0d44e6e12432166b06946228bd902e749eca2d1',
  c39: 'e2/79/e279f08b0d3323b2154fff9a5bae374c5fc5bf5c', c41: '20/82/20820ea2040ba75569b29a1ee946bb7d2f42e7ca', c44: '03/f6/03f69277c3a8a01ef6e46a9e26bf5c2dc38663b4',
  c51: 'c9/11/c911d8bded189bc1311514d331412566f3edc543', c52: 'e3/db/e3dbd9a34660323ffff7abb24dee42360128459b', c53: '41/60/4160f70c03f6c96aa6b8fa37fb7893825e83f830',
  c54: '24/57/245797b82390fe07517a525d1b0d3e6afd2fcdb6',
};
for (const p of REAL_CATALOG) {
  if (p.imageUrl) continue;
  if (EXTRA_IMG[p.id]) p.imageUrl = COSIMG(EXTRA_IMG[p.id]);
  else if (p.id === 'n03') p.imageUrl = 'https://nb.scene7.com/is/image/NB/un574vba_nb_02_i?$pdpflexf2$&wid=440&hei=440';
  else if (p.brandId === 'uniqlo') {
    // UNIQLO: la dirección de la foto sigue el mismo patrón que en las fichas leídas (referencia + código de color).
    const m = p.url?.match(/E(\d+)-000\/00\?colorDisplayCode=(\d+)/);
    if (m) p.imageUrl = UQIMG(m[1], m[2]);
  }
}
