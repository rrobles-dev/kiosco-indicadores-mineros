import { assetUrl } from '../lib/assets';

export interface Member {
  id: string;
  name: string;
  logo: string;
}

// Contenido de ejemplo genérico: no corresponde a empresas reales.
export const MEMBERS: Member[] = [
  { id: 'empresa-01', name: 'Empresa de ejemplo 1', logo: assetUrl('members/empresa-01.svg') },
  { id: 'empresa-02', name: 'Empresa de ejemplo 2', logo: assetUrl('members/empresa-02.svg') },
  { id: 'empresa-03', name: 'Empresa de ejemplo 3', logo: assetUrl('members/empresa-03.svg') },
  { id: 'empresa-04', name: 'Empresa de ejemplo 4', logo: assetUrl('members/empresa-04.svg') },
  { id: 'empresa-05', name: 'Empresa de ejemplo 5', logo: assetUrl('members/empresa-05.svg') },
  { id: 'empresa-06', name: 'Empresa de ejemplo 6', logo: assetUrl('members/empresa-06.svg') },
  { id: 'empresa-07', name: 'Empresa de ejemplo 7', logo: assetUrl('members/empresa-07.svg') },
  { id: 'empresa-08', name: 'Empresa de ejemplo 8', logo: assetUrl('members/empresa-08.svg') },
  { id: 'empresa-09', name: 'Empresa de ejemplo 9', logo: assetUrl('members/empresa-09.svg') },
  { id: 'empresa-10', name: 'Empresa de ejemplo 10', logo: assetUrl('members/empresa-10.svg') },
  { id: 'empresa-11', name: 'Empresa de ejemplo 11', logo: assetUrl('members/empresa-11.svg') },
  { id: 'empresa-12', name: 'Empresa de ejemplo 12', logo: assetUrl('members/empresa-12.svg') },
];
