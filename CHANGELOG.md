# Changelog

Todos los cambios relevantes del kiosco se registran en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/). La versión del producto es independiente de la versión del documento [`memory-bank/SPEC.md`](memory-bank/SPEC.md).

## [Unreleased]

## [1.0.0] - 2026-10-03

### Agregado

- Módulos de UF, dólar observado, euro, UTM y libra de cobre, con valores en formato chileno (`$41.073,57`, `US$ 6,56 /lb`) y fechas `dd-mm-aaaa`.
- Datos diarios desde mindicador.cl, sin claves de API ni backend.
- Fuente de respaldo automática (findic.cl) cuando la principal falla o entrega datos desactualizados, con reintentos y tiempo máximo de espera por consulta.
- Validación de vigencia según la frecuencia real de cada indicador: la UF debe ser del día, el dólar, el euro y el cobre aceptan hasta 4 días (fines de semana largos) y la UTM debe ser del mes en curso.
- Último valor conocido guardado en el navegador: si no hay dato vigente, el módulo lo muestra rotulado "Actualizado el dd-mm-aaaa" y con un estilo distinto, en vez de una pantalla de error.
- Arranque inmediato con los datos guardados de la sesión anterior, sin esperar a la primera consulta.
- Actualización automática de los datos cada 60 minutos, sin recargar la página y sin congelar la pantalla mientras se consulta.
- Mini gráfico de los últimos 30 días hábiles (12 meses para la UTM), con ejes siempre visibles, grilla y el último punto destacado, junto a la variación respecto del dato anterior. Se muestra desde el arranque y sea cual sea la fuente del valor actual.
- Rango mínimo del eje Y, para que variaciones pequeñas como la de la UF no parezcan movimientos fuertes.
- Tres presentaciones del módulo de indicador: destacada, compacta y en una línea.
- Barra de fecha y hora en America/Santiago ("viernes 02-10-2026 · 17:45"), actualizada al cambiar el minuto, con nombre de la organización opcional.
- Rotación de escenas por perfil (recepción e indicadores), seleccionable con `?perfil=` en la URL.
- Perfil de recepción con franja fija de indicadores siempre visible mientras rotan las escenas.
- Perfil de indicadores con un indicador destacado por escena, en orden aleatorio sin repeticiones, y los demás en una barra lateral.
- Los indicadores sin datos se saltan en la rotación; si no queda ninguno disponible, la pantalla lo indica y vuelve a intentar.
- Módulo de video (reel corporativo, publicidad, anuncios o video institucional) que se reproduce silenciado, avanza al terminar el video y se salta si no carga.
- Carrusel de logos (socios, patrocinadores, clientes o marcas) en páginas de 6 logos, con orden barajado en cada aparición y el mismo tiempo en pantalla para todos.
- Registro en la consola de los logos que no cargan, con su identificador y ruta.
- Título accesible configurable para el carrusel de logos ("Logos" por defecto).
- Escenas que terminan cuando termina su contenido, con un tope de seguridad para que un video defectuoso no detenga la rotación.
- Contenido de ejemplo genérico: video "Espacio para video" y 12 logos "Empresa de ejemplo 1" a "Empresa de ejemplo 12".
- Tamaños relativos a la pantalla, para escalar a pantallas de distinto tamaño.
- Publicación automática en GitHub Pages en cada cambio a la rama principal, con las pruebas y el lint como requisito previo.

[Unreleased]: https://github.com/rrobles-dev/kiosco-indicadores-mineros/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/rrobles-dev/kiosco-indicadores-mineros/releases/tag/v1.0.0
