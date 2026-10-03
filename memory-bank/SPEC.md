# SPEC v1: Kiosco de indicadores financieros y mineros

> **Estado:** borrador para validación · **Versión del documento:** 0.14 · **Fecha:** 2026-10-02
> **Alcance de este documento:** solo la v1. La v2 y la v3 se describen como contexto en la sección 3.

---

## 1. Problema de negocio

El kiosco es un **producto configurable** para cualquier organización que quiera mostrar indicadores y contenido propio en una pantalla de recepción o de eventos. Los indicadores, los perfiles, el video y los logos se definen en la configuración; el contenido de ejemplo incluido usa nombres genéricos (D-25).

**Caso de uso de ejemplo que guió el diseño:** una asociación gremial de proveedores de la minería (ficticia en este proyecto) recibe a socios, visitas y asistentes a eventos en su sede. Mientras esperan en recepción, o antes de que comience un evento, estas personas tienen frente a sí una pantalla que hoy no comunica nada.

La asociación quiere que esa pantalla cumpla dos funciones:

1. **Informar:** mostrar los indicadores que su audiencia consulta a diario para tomar decisiones comerciales, como el precio del cobre, el dólar y la UF.
2. **Dar visibilidad a los socios:** mostrar un video con las empresas asociadas, que se produce por separado, y sus logos.

**Restricción clave:** nadie opera la pantalla. Tiene que funcionar sola durante toda la jornada, tolerar caídas de internet o de las fuentes de datos y nunca mostrar una pantalla de error o un dato desactualizado como si fuera actual.

> Este proyecto reconstruye desde cero una solución real, usando solo datos públicos y contenido ficticio. No contiene código, datos ni material de la organización original.

---

## 2. Usuarios y escenario de uso

| Usuario | Contexto | Qué necesita |
|---|---|---|
| Socio o visita en recepción | Espera de 2 a 15 minutos, a 2 a 4 metros de la pantalla | Leer de un vistazo el valor del día y si sube o baja |
| Asistente a un evento | Sala llenándose, 10 a 30 minutos antes de comenzar | Contenido que rote y mantenga la atención |
| Personal de la asociación | Enciende la pantalla en la mañana y la apaga en la tarde | Que funcione sin intervención y que se note cuando un dato no está al día |

**Implicancias de diseño:**

- Sin interacción: no hay mouse, teclado ni pantalla táctil.
- Legible a distancia: valores grandes, pocos elementos por pantalla y alto contraste.
- Pantalla objetivo de **60 pulgadas vista a 4–5 m**; debe escalar a pantallas de eventos más grandes vistas desde más lejos. Full HD (1920 × 1080) es la resolución de referencia.
- Debe funcionar al menos 12 horas seguidas sin recargar la página.

---

## 3. Alcance

### 3.1 Incluido en la v1

- Módulos de indicadores: **UF, dólar observado, euro, UTM y libra de cobre**.
- **Mini gráfico de 30 días** en los módulos cuya fuente entregue serie reciente.
- **Módulo de video y carrusel de logos.** El video puede ser un reel corporativo, publicidad, anuncios o un video institucional; los logos pueden ser de socios, patrocinadores, clientes o marcas. Los videos largos se resuelven en el contenido, con videos más cortos; el código no segmenta videos.
- **Zonas con listas de reproducción y perfiles** (`recepcion` por defecto e `indicadores`), con rotación automática de escenas (sección 6.4).
- **Fuente primaria con respaldo**: mindicador.cl como primaria y findic.cl como respaldo.
- **Validación de vigencia** de cada dato según la frecuencia real del indicador.
- **Último valor conocido** guardado en el navegador, que se muestra marcado como desactualizado cuando no hay dato vigente.
- Despliegue estático, sin backend.

### 3.2 Fuera de la v1

| Elemento | Motivo | Versión |
|---|---|---|
| Cobre y divisas en vivo durante el día | Requiere API con clave, y una clave no puede ir en el frontend | v2 |
| Banco Central (API BDE) y CMF como fuentes oficiales | Requieren credenciales, por lo que necesitan backend | v2 |
| Datos de Cochilco (producción, inventarios) | Se publican en Excel, sin API: requieren un proceso ETL | v2 |
| Clima en regiones mineras y sismos | Valor agregado para la audiencia, no es parte del núcleo | v2 |
| Frecuencia de refresco distinta por módulo | La v1 usa una sola frecuencia para todos | v2 |
| IPSA | No hay una fuente gratuita confiable: findic lo entrega con un mes de atraso | Por definir |
| SII como fuente | Su RSS lleva semanas sin actualizarse y entrega XML con valores en texto | Descartado |
| Base de datos histórica | Solo tiene sentido con datos que no se pueden volver a consultar | v3 |
| Perfil `evento` | Combina contenido que aún no existe (próximos eventos, redes) | Futuro |
| Módulo de próximos eventos | Requiere una fuente de agenda por definir | Futuro |
| Módulo de redes sociales | Requiere backend: los tokens de las APIs no pueden ir en el frontend | Futuro |

### 3.3 Hoja de ruta

| Versión | Foco |
|---|---|
| **v1** | Kiosco solo frontend con datos diarios, respaldo y vigencia |
| **v2** | Backend (Spring Boot): fuentes oficiales con credenciales, cobre en vivo, ciclos por módulo, ETL de Cochilco, clima y sismos |
| **v3** | Base de datos (PostgreSQL + Liquibase) y módulos históricos |

---

## 4. Fuentes de datos

### 4.1 Resumen

| Fuente | Rol en la v1 | Autenticación | Formato | Estado |
|---|---|---|---|---|
| mindicador.cl | Primaria | Ninguna | JSON | ✅ Verificada el 2026-10-02: endpoint de resumen y CORS abierto (`*`) |
| findic.cl | Respaldo y serie reciente | Ninguna ("no se necesita llave, ni pagos, ni hay límites") | JSON | ✅ Verificada el 2026-10-02: los cinco endpoints y CORS abierto (`*`) |

### 4.2 mindicador.cl: endpoint de resumen

`GET https://mindicador.cl/api`

Respuesta observada el 2026-10-02 (extracto):

```json
{
  "version": "1.7.0",
  "autor": "mindicador.cl",
  "fecha": "2026-10-02T12:00:00.000Z",
  "uf": {
    "codigo": "uf",
    "nombre": "Unidad de fomento (UF)",
    "unidad_medida": "Pesos",
    "fecha": "2026-10-02T03:00:00.000Z",
    "valor": 41073.57
  },
  "libra_cobre": {
    "codigo": "libra_cobre",
    "nombre": "Libra de Cobre",
    "unidad_medida": "Dólar",
    "fecha": "2026-10-02T03:00:00.000Z",
    "valor": 6.56
  }
}
```

Observaciones que afectan el diseño:

- **Una sola llamada trae todos los indicadores.** La v1 consulta el resumen una vez por ciclo y reparte el resultado entre los módulos, en lugar de hacer cinco llamadas.
- **`fecha` viene en UTC.** `T03:00:00.000Z` corresponde a la medianoche en Chile en horario de verano (UTC-3). En invierno Chile usa UTC-4, así que **nunca se suma o resta un desfase fijo**: se convierte con la zona horaria `America/Santiago`.
- **El resumen no trae serie histórica.** La serie de 30 días se obtiene de findic.
- **Existen indicadores desactualizados en la misma respuesta.** El IPC venía con fecha de diciembre de 2025 y el bitcoin con fecha de septiembre. Esto confirma que validar la vigencia es obligatorio.
- **Un indicador con `fecha` inválida se omite**, igual que uno con `valor` que no es número finito; los demás indicadores se procesan normalmente.

### 4.3 findic.cl: endpoint por indicador

`GET https://findic.cl/api/{codigo}`, con `codigo` ∈ `uf | dolar | euro | utm | libra_cobre`.

Respuesta observada el 2026-10-02 para `libra_cobre` (extracto):

```json
{
  "version": "1.3.0",
  "autor": "findic.cl",
  "codigo": "libra_cobre",
  "nombre": "Libra de Cobre",
  "unidad_medida": "Dólar",
  "serie": [
    { "fecha": "2026-10-02", "valor": 6.56 },
    { "fecha": "2026-10-01", "valor": 6.57 },
    { "fecha": "2026-09-30", "valor": 6.55 }
  ]
}
```

Observaciones que afectan el diseño:

- **La fecha viene como `YYYY-MM-DD`, sin hora.** Es un formato distinto al de mindicador: cada adaptador normaliza a un formato común (sección 7).
- **La serie viene ordenada de la más reciente a la más antigua.** El adaptador ordena la serie por fecha y no depende del orden de llegada: si la fuente cambia el orden, `current` dejaría de ser el dato más reciente sin ningún error visible.
- **La serie salta los días sin mercado.** Entre el 17-09 y el 21-09 no hay datos por Fiestas Patrias. Este hueco de cuatro días justifica la regla de vigencia de la sección 5.2.
- **Los cinco endpoints tienen la misma forma** (verificado en la Fase 0).
- **La serie de `utm` es mensual:** una observación por mes, fechada el día 1 (`2026-10-01`, `2026-09-01`…). Permite un mini gráfico de 12 meses.
- **Los nombres no coinciden entre fuentes:** findic llama al euro "Euro (pesos por euro)" y mindicador solo "Euro". Las etiquetas en pantalla salen de la configuración (sección 5.1), nunca del campo `nombre` de la API.
- **Las fechas de findic son días de calendario y no se convierten de zona horaria.** `2026-10-02` ya es el día en Chile; interpretarla como instante (`new Date("2026-10-02")` es medianoche UTC) la correría al 1 de octubre. El adaptador solo valida que sea una fecha real de calendario y la usa tal cual.
- **`findicAdapter` hace una petición por indicador y omite los ids que fallan.** Solo lanza error si fallan todos los ids pedidos.

---

## 5. Catálogo de módulos

### 5.1 Módulos de indicador

| id | Etiqueta en pantalla | Unidad | Formato (es-CL) | Primaria | Respaldo | Serie 30 días |
|---|---|---|---|---|---|---|
| `uf` | UF | CLP | `$41.073,57` | mindicador | findic | findic |
| `dolar` | Dólar observado | CLP | `$983,84` | mindicador | findic | findic |
| `euro` | Euro | CLP | `$1.104,57` | mindicador | findic | findic |
| `utm` | UTM | CLP | `$72.151` | mindicador | findic | findic (12 meses, mensual) |
| `libra_cobre` | Cobre | USD por libra | `US$ 6,56 /lb` | mindicador | findic | findic |

Cada módulo de indicador muestra el valor actual, la fecha del dato, la variación respecto del dato anterior (cuando hay serie) y el mini gráfico (cuando hay serie).

**Variantes de presentación:** el mismo módulo se dibuja en tres variantes, elegidas por la escena que lo contiene. Los estados `loading`, `stale` y `empty` se comportan igual en las tres.

| Variante | Contenido |
|---|---|
| `large` | Etiqueta, valor, variación con la fecha del dato anterior, fecha del dato, fuente ("Fuente: mindicador.cl" o "Fuente: findic.cl" según `reading.source`) y gráfico con ejes: líneas de ejes y grilla horizontal en cada marca del eje Y, tres valores en el eje Y (mínimo, medio y máximo del dominio; el dominio es `centro ± span/2`, con `span = max(máx - mín de la serie, valorActual × minAxisSpanPct / 100)`, D-22), tres fechas en el eje X (inicio, mitad y fin, `dd-mm`, con una marca corta bajo cada una), último punto destacado y rótulo del período ("Últimos N días hábiles"; "Últimos N meses" para la UTM) |
| `compact` | Etiqueta, valor, variación, fecha y el mismo gráfico con ejes que `large` (D-21) |
| `minimal` | Etiqueta, valor y variación, en una línea |

### 5.2 Reglas de vigencia

Un dato está **vigente** si su fecha, convertida a `America/Santiago`, cumple la regla de su indicador:

| Indicador | Regla | Por qué |
|---|---|---|
| UF | La fecha del dato es **hoy** | La UF se publica para todos los días del calendario, incluidos fines de semana |
| Dólar y euro | El dato tiene **4 días o menos** | El dólar observado solo se fija en días hábiles; 4 días cubren un fin de semana largo |
| Libra de cobre | El dato tiene **4 días o menos** | Solo hay precio en días con mercado; el hueco de Fiestas Patrias en la serie de findic fue de 4 días |
| UTM | La fecha del dato es del **mes en curso** | La UTM es un valor mensual |

> Los umbrales son valores iniciales razonados y se ajustarán con datos reales. Si en producción aparecen falsos "desactualizados" (por ejemplo, después de feriados consecutivos), se revisa la regla y se registra en la sección 13.

### 5.3 Módulo de video

Reproduce un video de la organización: reel corporativo, publicidad, anuncios o video institucional.

| Propiedad | Valor |
|---|---|
| Contenido | Placeholder genérico en `public/media/video-demo.mp4` (24 s, 720p) con el texto "Espacio para video", sin marcas ni personas reales |
| Reproducción | Automática, **silenciada** e inline. Los navegadores bloquean la reproducción automática con sonido |
| Duración en pantalla | La escena termina cuando acaba el video, con un tope de seguridad de 90 s (D-23) |
| Si el video falla al cargar | La escena se salta de inmediato |

### 5.4 Carrusel de logos

Muestra logos de socios, patrocinadores, clientes o marcas.

| Propiedad | Valor |
|---|---|
| Contenido | 12 logos SVG genéricos de ejemplo en `public/members/` ("Logo 1" a "Logo 12", con nombres "Empresa de ejemplo 1" a "Empresa de ejemplo 12"); la lista está en `src/config/members.ts` |
| Páginas | De 6 logos, cada una durante 8 s |
| Orden | Se baraja con Fisher-Yates en cada aparición del módulo, para que nadie quede siempre primero ni último (D-24) |
| Tiempo por logo | El mismo para todos: cada página dura lo mismo |
| Fin | La escena termina al acabar la última página (tope de seguridad de 30 s) |
| Si un logo no carga | Se oculta, sin romper la página, y se registra con `console.warn` (id y ruta) |
| Título accesible | Configurable con `title` en el módulo `logos` de la escena; por defecto "Logos" |

---

## 6. Comportamiento

### 6.1 Ciclo de actualización

En la v1 todos los módulos de indicador comparten un mismo ciclo:

1. Al cargar la aplicación, se ejecuta el ciclo de inmediato.
2. Después se repite cada **60 minutos** (configurable).

> **Por qué cada 60 minutos y no una vez al día:** "diario" describe con qué frecuencia **cambia el dato**, no con qué frecuencia hay que consultarlo. Si la pantalla se enciende a las 8:00 y la fuente publica el valor del día a las 9:30, consultar una sola vez dejaría el valor de ayer toda la jornada. Consultar cada hora un dato diario cuesta muy poco y asegura tomar la publicación cuando ocurre.

### 6.2 Obtención de datos por indicador

Para cada indicador, el sistema recorre la cadena de fuentes en orden:

```
Fuente primaria (mindicador)
  ├─ intento 1 → si falla, espera 2 s
  ├─ intento 2 → si falla, espera 4 s
  ├─ intento 3 → si falla, espera 8 s
  └─ intento 4 → si falla o el dato no está vigente → siguiente fuente

Fuente de respaldo (findic)
  └─ misma política de reintentos

Caché local (último valor conocido)
  └─ se muestra como "desactualizado"
     (D-12: se elige la lectura de fecha más reciente entre la caché y los datos
     no vigentes obtenidos de las fuentes)

Sin caché
  └─ el módulo queda "sin datos" y se salta en la rotación
```

Reglas:

- **Timeout por intento:** 8 segundos, cancelando la petición con `AbortController`.
- **Cuenta como falla:** error de red, timeout, código HTTP distinto de 2xx, JSON inválido o un valor que no es número finito.
- **Un dato no vigente no es un error de red:** no se reintenta en la misma fuente; se pasa directo a la siguiente.
- **Enriquecimiento de series (D-15):** tras recorrer las fuentes, las lecturas (`fresh` o `stale`) que no traen serie se completan con una única llamada a findic, sin reintentos y con el mismo timeout por intento. `source` no cambia: indica de dónde viene el valor actual. Si la llamada falla, la lectura queda sin serie y su estado no cambia: una serie ausente nunca degrada un dato vigente. Las lecturas que ya vienen de findic no se vuelven a pedir.
- **La caché se escribe al final del ciclo**, con las lecturas vigentes ya enriquecidas, para que el estado inicial (D-14) muestre el gráfico desde el arranque.
- **Mientras se recorre la cadena, el módulo sigue mostrando lo que tenía.** Nunca se vacía la pantalla para "cargar".

### 6.3 Estados de un módulo de indicador

| Estado | Cuándo | Qué se ve |
|---|---|---|
| `loading` | Primer ciclo, sin caché previa | Esqueleto del módulo (no un spinner) |
| `fresh` | Se obtuvo un dato vigente | Valor, fecha, variación y mini gráfico |
| `stale` | No hubo dato vigente, pero existe caché | El último valor con la marca "Actualizado el dd-mm-aaaa", en un estilo visual distinto |
| `empty` | No hubo dato vigente ni caché | El módulo no se muestra; se salta en la rotación |

Transiciones permitidas:

```
loading → fresh | stale | empty
fresh   → fresh | stale
stale   → fresh | stale
empty   → fresh | stale | empty
```

**Estado inicial (D-14):** se calcula desde la caché al montar la aplicación. Si hay una lectura guardada y sigue vigente, el módulo parte en `fresh`; si hay lectura pero no está vigente, en `stale`; si no hay caché, en `loading`. Por eso un módulo puede partir directamente en `fresh` o `stale`.

### 6.4 Presentación: zonas, listas de reproducción y perfiles (D-17)

La pantalla se divide en **zonas**. La zona principal reproduce una **lista de reproducción** de **escenas**; la zona secundaria no rota.

- **Escena:** uno o dos módulos con un layout (`full` o `halves`). Termina **por tiempo** (`durationMs`, 15 s en las escenas de indicadores) o **por contenido**: sin `durationMs`, termina cuando el módulo llama a `onComplete` (fin del video, última página de logos) y `maxDurationMs` es un tope de seguridad obligatorio (D-23). Gana lo que ocurra primero; un `onComplete` tardío de una escena anterior se ignora.
- **Lista de reproducción:** `sequential` (en orden, y vuelve al inicio) o `shuffle`.
- **Barajado sin repetición (D-19):** se baraja con Fisher-Yates en cada vuelta; todas las escenas aparecen una vez por vuelta y la primera de una vuelta nunca repite la última de la anterior.
- **Se salta** una escena si todos sus módulos de indicador están en estado `empty`; las escenas de video y logos siempre son reproducibles. Si ninguna escena es reproducible, la zona principal muestra "Indicadores no disponibles por el momento" y reintenta cada pocos segundos.
- **La zona secundaria** muestra los indicadores en variante `minimal` y oculta los que están `empty`.
- **La reproducción es independiente del ciclo de datos:** una fuente lenta nunca congela la pantalla.

**Perfiles.** Se eligen con `?perfil=`; un valor ausente o desconocido usa `recepcion`.

| Perfil | Layout | Zona principal | Zona secundaria |
|---|---|---|---|
| `recepcion` (por defecto) | `main-strip` | Secuencial: cobre (`full`, `large`, 15 s) → dólar y euro (`halves`, `compact`, 15 s) → video (por contenido, tope 90 s) → UF y UTM (`halves`, `compact`, 15 s) → logos (por contenido) | Franja con los cinco indicadores en `minimal`, fija durante todas las escenas, incluidos el video y los logos (D-18) |
| `indicadores` | `featured-sidebar` | `shuffle`, una escena `full` `large` por indicador | Barra lateral con los demás indicadores en `minimal` (omite el destacado) |

**Barra de fecha y hora.** Aparece en ambos perfiles, sobre las zonas. Muestra la fecha y la hora en `America/Santiago` ("viernes 02-10-2026 · 17:45": día de la semana en minúsculas, fecha `dd-mm-aaaa` y hora `HH:mm`) y se actualiza al inicio de cada minuto. El perfil puede definir un nombre de organización opcional (`organization`); si no lo define, no se muestra nada en su lugar.

---

## 7. Modelo de datos (TypeScript)

```typescript
// Identificadores
export type IndicatorId = 'uf' | 'dolar' | 'euro' | 'utm' | 'libra_cobre';
export type SourceId = 'mindicador' | 'findic';

// Formato común al que normaliza cada adaptador
export interface Observation {
  /** Fecha del dato en America/Santiago, formato YYYY-MM-DD */
  date: string;
  value: number;
}

export interface IndicatorReading {
  id: IndicatorId;
  current: Observation;
  /** Ordenada de la más antigua a la más reciente. Ausente si la fuente no entrega serie. */
  series?: Observation[];
  source: SourceId;
  /** Momento de obtención, ISO 8601 en UTC */
  fetchedAt: string;
}

export type ModuleStatus = 'loading' | 'fresh' | 'stale' | 'empty';

export interface IndicatorModuleState {
  id: IndicatorId;
  status: ModuleStatus;
  reading?: IndicatorReading;
}

// Reglas de vigencia
export type FreshnessRule =
  | { kind: 'sameDay' }
  | { kind: 'maxAgeDays'; days: number }
  | { kind: 'sameMonth' };

// Contrato de cada fuente: cambiar de fuente es cambiar el adaptador, no el módulo
export interface SourceAdapter {
  id: SourceId;
  fetchReadings(
    ids: IndicatorId[],
    signal: AbortSignal,
  ): Promise<Partial<Record<IndicatorId, IndicatorReading>>>;
}

// Configuración declarativa de cada módulo
export interface IndicatorModuleConfig {
  id: IndicatorId;
  label: string;
  unit: 'CLP' | 'USD_PER_LB';
  /** Decimales fijos al mostrar el valor */
  decimals: number;
  /** Cantidad de observaciones de la serie que se grafican */
  chartPoints: number;
  /** Rango mínimo del eje Y del gráfico, en % del valor actual */
  minAxisSpanPct: number;
  freshness: FreshnessRule;
  /** Orden de la cadena de fuentes; la primera es la primaria */
  sources: SourceId[];
}

// Respuestas crudas observadas (solo las usan los adaptadores)
export interface MindicadorIndicatorRaw {
  codigo: string;
  nombre: string;
  unidad_medida: string;
  fecha: string; // ISO 8601 en UTC, p. ej. "2026-10-02T03:00:00.000Z"
  valor: number;
}

export interface FindicSeriesRaw {
  version: string;
  autor: string;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  serie: Array<{ fecha: string; valor: number }>; // fecha "YYYY-MM-DD", más reciente primero
}
```

---

## 8. Arquitectura

### 8.1 Stack

| Capa | Elección | Por qué |
|---|---|---|
| UI | React 19.2 + TypeScript 6.0 (strict) | Stack principal del autor |
| Build | Vite 8.3 | Arranque rápido y build estático simple |
| Pruebas | Vitest 5 + React Testing Library | API compatible con Jest, integrada con Vite |
| Estilos | CSS Modules con variables CSS | Sin dependencias extra; suficiente para una pantalla fija |
| Gráficos | SVG propio para el mini gráfico | Es una línea simple: una librería de gráficos no se justifica |
| Despliegue | GitHub Pages con GitHub Actions (D-26) | Sitio estático, sin servidor. Cada push a `main` corre las pruebas (`test:run` y `test:tz`) y el lint, y solo si pasan publica el build. El sitio vive en la subruta `/kiosco-indicadores-mineros/`, por lo que las rutas de assets se construyen con `BASE_URL` (D-27) |

### 8.2 Estructura de carpetas propuesta

```
src/
├── app/                  # Composición: App, barra superior, carrusel
├── modules/
│   ├── indicator/        # Componente de módulo de indicador y mini gráfico
│   ├── video/            # Módulo de video
│   └── logos/            # Carrusel de logos
├── data/
│   ├── adapters/         # mindicador.ts, findic.ts (normalizan a IndicatorReading)
│   ├── chain.ts          # Recorre la cadena de fuentes con reintentos
│   ├── freshness.ts      # Reglas de vigencia
│   ├── cache.ts          # Lectura y escritura del último valor conocido
│   └── scheduler.ts      # Ciclo de refresco
├── config/
│   └── modules.ts        # Catálogo declarativo (sección 5)
├── lib/                  # Formato es-CL, fechas en America/Santiago
└── types/                # Tipos de la sección 7
```

**Regla de dependencias:** los componentes de `modules/` no importan nada de `data/adapters/`. Reciben un `IndicatorModuleState` y lo dibujan. Así, cambiar mindicador por el Banco Central en la v2 no toca la interfaz.

### 8.3 Caché local

- Se usa `localStorage`, con una clave por indicador: `kiosco:v1:reading:{id}`.
- Se guarda el `IndicatorReading` completo en JSON.
- Si el JSON guardado no es válido, se descarta y se trata como si no hubiera caché.
- El prefijo `v1` permite invalidar toda la caché si cambia el formato en una versión futura.

---

## 9. Requisitos no funcionales

| Requisito | Criterio |
|---|---|
| Legibilidad | El valor principal se lee a 4–5 m en una pantalla de 60 pulgadas. Los tamaños se definen en unidades relativas a la pantalla (`vh`, `vw`, `clamp`) para que escalen a pantallas más grandes vistas desde más lejos (D-20). El ajuste tipográfico fino queda como trabajo posterior, validado frente a una pantalla real a distancia |
| Contraste | Texto con contraste AA o superior; el estado `stale` no depende solo del color (incluye texto) |
| Estabilidad | 12 horas de funcionamiento sin recargar y sin crecimiento sostenido de memoria |
| Resiliencia | Sin internet, la pantalla sigue rotando con lo que tenga en caché |
| Rendimiento | El primer módulo visible en menos de 3 segundos con red normal (usando caché si existe) |
| Movimiento | Transiciones suaves; se respeta `prefers-reduced-motion` |
| Idioma y formato | Español de Chile: separador de miles `.`, decimal `,`, fechas dd-mm-aaaa |

---

## 10. Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| CA-01 | mindicador responde con datos vigentes | Se ejecuta el ciclo | Los cinco módulos quedan `fresh` con fuente `mindicador` |
| CA-02 | mindicador no responde | Se agotan sus 4 intentos | Se consulta findic y, si su dato es vigente, el módulo queda `fresh` con fuente `findic` |
| CA-03 | mindicador responde, pero la UF trae fecha de ayer | Se valida la vigencia | No se reintenta mindicador para la UF y se consulta findic directamente |
| CA-04 | Ambas fuentes fallan y existe caché | Termina el ciclo | El módulo queda `stale` y muestra "Actualizado el dd-mm-aaaa" |
| CA-05 | Ambas fuentes fallan y no existe caché | Termina el ciclo | El módulo queda `empty` y no aparece en la rotación |
| CA-06 | Es lunes y el último dólar disponible es del viernes | Se valida la vigencia | El dólar se considera vigente (3 días ≤ 4) |
| CA-07 | Es 1 de octubre y la UTM disponible es de septiembre | Se valida la vigencia | La UTM se considera desactualizada |
| CA-08 | La fuente entrega `"fecha": "2026-10-02T03:00:00.000Z"` | Se normaliza la fecha | Se guarda `2026-10-02` (fecha en `America/Santiago`) |
| CA-09 | Una petición tarda más de 8 s | Se cumple el timeout | Se cancela y cuenta como intento fallido |
| CA-10 | La aplicación está rotando | Pasan 15 s en un módulo de indicador | Avanza al siguiente módulo no `empty` |
| CA-11 | El módulo de video está en pantalla | Termina el video | Avanza al siguiente módulo |
| CA-12 | El video no carga | Le toca su turno en la rotación | Se salta |
| CA-13 | Un ciclo de datos está en curso | La rotación sigue | La pantalla no se congela ni se vacía |
| CA-14 | Hay serie de 30 días | Se dibuja el módulo | Se muestran el mini gráfico y la variación respecto del dato anterior |
| CA-15 | Un valor recibido no es un número finito | El adaptador procesa la respuesta | Se trata como falla de esa fuente |
| CA-16 | La fuente entrega una `fecha` que no es fecha válida | El adaptador procesa la respuesta | El indicador se omite y los demás se procesan normalmente |

### Estrategia de pruebas

- **Adaptadores:** pruebas unitarias con *fixtures* tomadas de respuestas reales (las de la sección 4), guardadas en `src/data/adapters/__fixtures__/`.
- **Vigencia:** casos de calendario explícitos: fin de semana, fin de semana largo, cambio de mes y cambio de horario (UTC-3 a UTC-4).
- **Cadena de fuentes:** `fetch` simulado y timers falsos de Vitest para verificar reintentos, esperas y timeout sin esperar en tiempo real.
- **Componentes:** React Testing Library para los cuatro estados del módulo y para la rotación con timers falsos.

---

## 11. Fase 0: verificaciones antes de implementar

Estas verificaciones se hacen **antes de escribir código**. Si alguna falla, se actualiza esta spec primero.

**Resultado (2026-10-02):** las cuatro verificaciones pasaron. Ambas fuentes responden `access-control-allow-origin: *`, así que la v1 no necesita proxy. Los endpoints de findic tienen la misma forma y las fixtures quedaron guardadas.

**V-01. CORS de mindicador.** Una aplicación en el navegador solo puede leer la respuesta si el servidor lo permite.

```bash
curl -sI -H "Origin: http://localhost:5173" https://mindicador.cl/api | grep -i "access-control-allow-origin"
```

**V-02. CORS de findic.**

```bash
curl -sI -H "Origin: http://localhost:5173" https://findic.cl/api/libra_cobre | grep -i "access-control-allow-origin"
```

Resultado esperado en ambas: una línea `access-control-allow-origin: *` o con el origen indicado. **Si no aparece**, la v1 necesita un proxy mínimo (por ejemplo, una función serverless) y eso se registra como cambio de alcance.

**V-03. Forma de los demás endpoints de findic.**

```bash
for c in uf dolar euro utm; do
  echo "== $c"; curl -s "https://findic.cl/api/$c" | head -c 300; echo
done
```

Resultado esperado: misma estructura que `libra_cobre` (`codigo`, `unidad_medida`, `serie[]`).

**V-04. Guardar fixtures reales.**

```bash
mkdir -p src/data/adapters/__fixtures__
curl -s https://mindicador.cl/api > src/data/adapters/__fixtures__/mindicador-resumen.json
for c in uf dolar euro utm libra_cobre; do
  curl -s "https://findic.cl/api/$c" > "src/data/adapters/__fixtures__/findic-$c.json"
done
```

---

## 12. Glosario de negocio

| Término | Significado | Por qué importa en esta pantalla |
|---|---|---|
| **UF (Unidad de Fomento)** | Unidad de cuenta reajustada por inflación, expresada en pesos | Se usa en contratos, arriendos y créditos: los socios la consultan a diario |
| **UTM (Unidad Tributaria Mensual)** | Unidad tributaria que cambia una vez al mes | Se usa en multas, impuestos y trámites |
| **Dólar observado** | Tipo de cambio oficial que publica el Banco Central para cada día hábil | Es el valor de referencia para contratos; no es el dólar que se transa en tiempo real |
| **Libra de cobre** | Precio del cobre en dólares por libra (1 libra ≈ 0,4536 kg) | Es el principal producto de exportación de Chile y el negocio de la audiencia |
| **BML / LME** | Bolsa de Metales de Londres, referencia mundial del precio del cobre | La fuente de referencia del precio que se muestra |
| **COMEX** | Mercado de futuros de metales de Nueva York | Referencia alternativa, con cotización en vivo (v2) |
| **Vigencia** | Que la fecha del dato corresponda a la frecuencia esperada del indicador | Mostrar un dato viejo como actual le quita credibilidad a la pantalla |

---

## 13. Registro de decisiones

| # | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| D-01 | v1 solo frontend | Backend desde la v1 | Las fuentes de la v1 no requieren clave; el backend se justifica en la v2 |
| D-02 | mindicador como primaria, findic como respaldo | Una sola fuente | Ambas son gratuitas y sin clave; el respaldo agrega resiliencia sin costo |
| D-03 | Descartar el RSS del SII | Usarlo como respaldo | Llevaba semanas sin actualizarse y su formato exige parsear texto |
| D-04 | Refresco cada 60 min en la v1 | Una vez al día | Asegura tomar la publicación del día sin depender de la hora de encendido |
| D-05 | Mostrar el último valor marcado como desactualizado | Mostrar una pantalla de error | Un dato viejo bien rotulado es más útil que un error en una sala de espera |
| D-06 | Saltar módulos sin datos | Mostrar el módulo vacío | Una pantalla vacía comunica falla; saltarla mantiene la experiencia |
| D-07 | Adaptador por fuente | Llamar a la API desde cada componente | Cambiar de fuente en la v2 no debe obligar a reescribir la interfaz |
| D-08 | Mini gráfico en SVG propio | Librería de gráficos | Una línea simple no justifica una dependencia |
| D-09 | Mini gráfico de 12 meses para la UTM | UTM sin gráfico | La Fase 0 mostró que findic entrega serie mensual; el costo es mínimo |
| D-10 | Etiquetas desde la configuración | Usar el campo `nombre` de cada API | Las fuentes nombran distinto el mismo indicador; la pantalla debe ser consistente al cambiar de fuente |
| D-11 | React 19 en vez de 18 | React 18 | Es la versión del template actual; no hay diferencias relevantes para esta app |
| D-12 | En stale se muestra la observación más reciente entre fuentes no vigentes y caché | Mostrar siempre la caché | Lo que se muestra como desactualizado debe ser lo menos desactualizado posible |
| D-13 | Eliminar "cache" de SourceId | Marcar las lecturas de caché con source "cache" | source indica de dónde viene el dato; la caché es un almacenamiento, no una fuente |
| D-14 | Estado inicial calculado desde la caché | Partir siempre en loading | Un dato guardado que sigue vigente no debe mostrarse como cargando ni como desactualizado; además cumple el requisito de primer módulo en < 3 s |
| D-15 | La serie siempre se pide a findic, un solo intento | Usar la serie solo cuando el valor viene de findic | Valor y serie son responsabilidades distintas; la serie complementa y no justifica reintentos |
| D-16 | Agrupación de miles siempre (`useGrouping: 'always'`) | Formato por defecto de es-CL | es-CL sigue la norma RAE de no agrupar cifras de 4 dígitos, pero la convención financiera chilena escribe $1.104,57 |
| D-17 | Zonas con listas de reproducción y perfiles | Una sola rotación de módulos | Una misma app sirve a recepción, oficina y eventos; es el modelo estándar de señalética digital |
| D-18 | Franja fija de indicadores en recepción | Indicadores solo dentro de la rotación | Ningún valor desaparece mientras corre otro contenido |
| D-19 | Barajado sin repetición | Aleatorio puro | Garantiza que todos aparezcan en cada vuelta y evita repeticiones seguidas |
| D-20 | Unidades relativas a la pantalla | Píxeles fijos | La misma configuración escala a pantallas más grandes vistas desde más lejos |
| D-21 | Ejes X e Y visibles en todo gráfico, con líneas de ejes y grilla horizontal en cada marca del eje Y | Gráficos sin ejes en las variantes pequeñas | Un gráfico sin referencias puede contar una historia falsa aunque los datos sean correctos |
| D-22 | Rango mínimo del eje Y (2 % del valor, configurable) | Escalar siempre al mínimo y máximo de la serie | Evita que variaciones mínimas, como la de la UF, parezcan movimientos fuertes, y evita la división por cero cuando todos los valores son iguales |
| D-23 | Escenas que terminan por contenido con tope de seguridad | Duración fija para todas las escenas | El reel debe durar lo que dura el video; el tope evita que un video defectuoso congele la rotación |
| D-24 | Carrusel con orden barajado y tiempo igual por logo | Orden fijo | Socios con la misma cuota esperan la misma exposición |
| D-25 | Contenido de ejemplo genérico y módulos configurables | Contenido de ejemplo con nombres del caso de uso | El kiosco sirve a cualquier organización y se evita cualquier coincidencia con empresas reales |
| D-26 | GitHub Pages con GitHub Actions | Netlify | Todo el proyecto queda en GitHub y el pipeline corre las pruebas antes de cada despliegue |
| D-27 | Rutas de assets construidas con BASE_URL | Rutas absolutas desde la raíz | En una subruta, las rutas absolutas apuntan fuera del sitio y fallan sin error visible |

---

## 14. Preguntas abiertas

1. ¿El orden de rotación por defecto (cobre primero) representa bien la prioridad de la audiencia?
2. **Pendiente técnico:** `sleep` cancelable con `AbortSignal`, para liberar el timer de timeout de la cadena cuando la fuente responde a tiempo. Hoy ese timer queda pendiente hasta vencer (8 s) sin efecto; no es un bug, es una mejora.
2. ¿15 segundos por módulo es suficiente para leer valor, fecha y variación a distancia?
3. ¿Se quiere mostrar la fuente del dato en pantalla ("Fuente: mindicador.cl")? Es buena práctica de transparencia, pero agrega texto.
