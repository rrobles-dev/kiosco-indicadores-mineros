# AGENTS.md

Instrucciones para agentes de IA (Claude Code, Copilot u otros) que trabajen en este repositorio.

## Antes de cualquier tarea

1. Lee [`memory-bank/SPEC.md`](memory-bank/SPEC.md). Es la fuente de verdad del alcance, los contratos de datos y los criterios de aceptación.
2. Si la tarea contradice la spec, **detente y pregunta**. No cambies el comportamiento sin actualizar primero la spec.
3. Trabaja solo dentro del alcance de la v1 (sección 3.1 de la spec). Lo que aparece como v2 o v3 no se implementa todavía.

## Reglas de arquitectura

- **Los componentes no conocen las fuentes.** Nada dentro de `src/modules/` importa desde `src/data/adapters/`. Los componentes reciben un `IndicatorModuleState` y lo dibujan.
- **Un adaptador por fuente.** Cada adaptador normaliza la respuesta cruda al tipo `IndicatorReading` (sección 7 de la spec).
- **Las etiquetas en pantalla vienen de `src/config/`**, nunca del campo `nombre` de una API.
- **Fechas siempre en `America/Santiago`** usando `Intl` o equivalente. Nunca sumar ni restar un desfase fijo de horas: Chile cambia entre UTC-3 y UTC-4.
- **Formato es-CL:** separador de miles `.`, decimal `,`, fechas `dd-mm-aaaa`.
- **Sin claves de API en el código.** Las fuentes de la v1 no las requieren. Si una tarea necesita una clave, corresponde a la v2 y requiere backend.

## Reglas de código

- TypeScript en modo `strict`. Sin `any` salvo justificación en un comentario.
- Validar los datos externos antes de usarlos: un valor que no es número finito cuenta como falla de la fuente.
- Toda petición de red con timeout, cancelada mediante `AbortController`.

## Pruebas

- Toda lógica en `src/data/` y `src/lib/` lleva pruebas unitarias.
- Las pruebas de adaptadores usan las fixtures reales de `src/data/adapters/__fixtures__/`. No inventes respuestas de API.
- Las pruebas de vigencia cubren al menos: fin de semana, fin de semana largo, cambio de mes y cambio de horario.
- Usa timers falsos para reintentos, timeouts y rotación; ninguna prueba espera en tiempo real.
- Antes de cada commit con lógica de fechas, corre `npm run test:tz`. El kiosco corre en Chile y las pruebas pueden correr en cualquier zona horaria: el código no debe depender de la zona de la máquina.

## Comandos

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción (incluye chequeo de tipos)
npm run lint    # ESLint
```

## Commits

- Formato Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.
- Mensajes en español.
- Un commit por cambio lógico; no mezclar refactor con funcionalidad nueva.

## Documentación

- Si una decisión cambia o se agrega una nueva, regístrala en la sección 13 de la spec con su motivo.
- Si un criterio de aceptación queda cubierto por una prueba, indica en el PR qué prueba lo cubre.
