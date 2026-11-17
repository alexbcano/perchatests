# Percha — estilista personal (Fase 1, MVP funcional)

Webapp que propone outfits según medidas, gustos, presupuesto, temporada y armario; desglosa cada look en prendas, recomienda talla con la tabla de cada marca, lo muestra sobre un avatar a escala y da consejos de estilismo.

«Percha» es un nombre de trabajo.

## Arrancar

```bash
npm install
npm run dev        # desarrollo
npm run build      # comprueba tipos y genera dist/index.html (un solo archivo, alojable en cualquier estático)
```

React 18 + TypeScript + Tailwind CSS + Vite. Estado con zustand. Sin backend en esta fase.

## Catálogo real (hombre)

Desde el 16 de noviembre de 2026 la app arranca con un catálogo de **85 productos reales de hombre** (`src/data/real/catalog.ts`) de COS, UNIQLO, Camper, New Balance, Levi's, Carhartt WIP y Massimo Dutti. Cada uno lleva el enlace a su ficha y el precio que mostraba la tienda ese día.

- **No se actualiza solo.** Precio, colores y existencias son una foto de ese día; la app lo indica y el dato vigente es el de la ficha. Para refrescarlo hay que volver a leer las tiendas (o montar un backend con feeds).
- **Fotos.** Los productos con foto la cargan desde la web de la tienda. Abierta como archivo local se ven; en alojamientos que bloquean imágenes externas se muestra el dibujo.
- **Tallas.** Solo hay tabla oficial para COS (partes de arriba, abrigos, pantalones, cinturones). En el resto, el recomendador dice que falta la tabla y no recomienda. En COS los pantalones se publican por pareja de tallas y se reparten a medias (confianza media como máximo).
- **Clasificación propia.** Estilo, temporada, formalidad y color del dibujo los asigna Percha; no son datos de la marca. En UNIQLO, el color de los productos sin ficha leída se deduce del código de color de la URL y es aproximado.
- **Referentes.** Creadores reales de listas públicas con enlace a la fuente (`src/data/real/referents.ts`); los estilos asociados son orientativos.
- El catálogo de demostración sigue disponible en Mi perfil → Aplicación → Catálogo.

## Qué es real y qué es demostración

| Pieza | Estado | Dónde |
| --- | --- | --- |
| Generador de outfits | Funciona (motor de reglas) | `src/features/outfits/engine.ts` |
| Interpretación del texto libre | Funciona (reglas) | `src/features/outfits/textQuery.ts` |
| Recomendador de tallas | Funciona; tablas de ejemplo | `src/features/sizing/recommend.ts` |
| Consejos, variaciones, sustituciones | Funciona (reglas) | `src/features/outfits/styling.ts` |
| Avatar y probador 2D (frontal y lateral) | Funciona | `src/ui/figure/` |
| Armario, favoritos, colecciones, historial, comparar, compartir | Funciona | `src/pages/` |
| Catálogo, marcas, precios, tallas, existencias | **Demostración** (ficticio) | `src/data/demo/` |
| Referentes de moda | **Demostración** (perfiles ficticios, editables en la app) | `src/data/demo/referents.ts` |
| Imágenes de los looks | Ilustraciones SVG generadas por código | `src/ui/figure/index.tsx` |
| Estilista con IA | Opcional: solo si el alojamiento ofrece un modelo | `src/services/ai/` |
| Probador sobre fotografía | No conectado (interfaz definida) | `src/services/tryon/` |
| Autenticación propia, base de datos propia | No incluidas en esta fase | ver «Fase 2» |

Regla que cumple todo el código: nunca se inventan productos, precios, enlaces, tallas ni disponibilidad como si fueran reales. Cada producto de demostración lleva `demo: true` y `url: null`, y la interfaz lo marca.

No hay fotografía de moda ni imágenes generadas por IA: en su lugar, cada look se dibuja con el mismo motor paramétrico que el avatar y se etiqueta como «Ilustración conceptual».

## Estructura

```
src/
  app/            Shell, rutas por hash (#crear…), estado global
  domain/         Tipos y taxonomía (prendas, temporadas, unidades). Sin dependencias
  data/demo/      Datos de demostración: catálogo, marcas y tablas de tallas, estilos, referentes
  services/
    catalog/      CatalogProvider: interfaz + proveedor demo (aquí entra el catálogo real)
    ai/           Estilista IA (interfaz + implementación opcional)
    storage/      Persistencia: local + almacén privado por usuario cuando el alojamiento lo ofrece
    tryon/        Interfaz del probador sobre fotografía (Fase 3)
  features/
    outfits/      Motor de generación, texto libre, consejos, compartir
    sizing/       Recomendador de tallas
  ui/             Componentes reutilizables, formularios, maniquí SVG
  pages/          Inicio, Crear outfit, Detalle, Tendencias, Mi armario, Favoritos, Mi perfil, Onboarding
```

Separación pedida: interfaz (`ui/`, `pages/`), lógica de negocio (`features/`), datos y persistencia (`services/storage`), IA (`services/ai`), catálogo (`services/catalog`), tallas (`features/sizing`).

## Cómo funciona el motor

1. Une formulario, texto libre y referentes en una petición efectiva (el texto manda).
2. Filtra candidatos por mercado, temporada, existencias, colores y prendas excluidas; añade las prendas del armario si procede.
3. Puntúa cada prenda por estilo, color, formalidad según ocasión, atrevimiento y abrigo.
4. Monta combinaciones (abajo → arriba → capa → calzado → accesorios) cuidando armonía de color y choques de capas, y las ajusta al presupuesto.
5. Calcula la compatibilidad (estilo 30, color 15, presupuesto 15, temporada 15, ocasión 15, atrevimiento 10) y elige de 3 a 6 looks distintos.

Tallas: no hay conversión universal. Cada recomendación compara las medidas con la tabla de la marca y el grupo de prenda, indica margen de holgura, alternativa y confianza, y dice claramente cuándo faltan datos.

## Privacidad

- Medidas, gustos, armario y favoritos se guardan en el navegador y, si el alojamiento lo ofrece, en un espacio privado por usuario.
- Las fotografías no salen del dispositivo.
- El consentimiento para uso en entrenamiento está desactivado por defecto y no envía nada.
- «Mi perfil → Privacidad y datos» permite copiar y borrar todo.

## Fase 2 — integraciones reales

Recomendado: migrar el shell a Next.js (App Router) para tener rutas de servidor donde viven las claves (`.env.example`). La UI y `features/` no cambian; se sustituyen implementaciones en `services/`.

- **Base de datos y autenticación**: PostgreSQL (tablas `users`, `measurements`, `preferences`, `wardrobe_items`, `saved_outfits`, `collections`, `searches`, `referents`) + Auth.js o Supabase Auth. `services/storage` pasa a llamar a `/api/*`.
- **Catálogo real**: implementar `CatalogProvider` contra feeds de afiliación o APIs de tienda desde `/api/catalog/search`; precios y existencias con caché corta; `url` real por producto.
- **Tablas de tallas reales** por marca y producto, sustituyendo `data/demo/brands.ts`.
- **IA**: `/api/stylist` para interpretar el texto y redactar explicaciones; el motor de reglas queda como validador (presupuesto, existencias, exclusiones).
- **Fotografías**: almacenamiento privado con URLs firmadas.

## Fase 3 — experiencia avanzada

Probador sobre fotografía (`TryOnProvider`), avatar 3D solo si representa bien las prendas, tendencias con datos actualizados y verificables (`sourceUrl` por referente), personalización a partir del historial.

## Publicar en GitHub Pages

La web se sirve desde la carpeta `docs/` de la rama `main`
(Settings → Pages → Deploy from a branch → `main` / `/docs`).
Para actualizarla: `npm run publicar`, y después commit y push.
