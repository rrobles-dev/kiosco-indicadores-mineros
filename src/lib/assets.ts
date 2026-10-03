/**
 * Ruta de un archivo de public/ bajo la base del despliegue (D-27).
 * Con base "/kiosco-indicadores-mineros/", "members/empresa-01.svg" queda como
 * "/kiosco-indicadores-mineros/members/empresa-01.svg". Nunca genera dobles barras.
 */
export function assetUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
