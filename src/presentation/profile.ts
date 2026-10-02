import { DEFAULT_PROFILE, PROFILES } from '../config/profiles';
import type { Profile } from '../types/presentation';

/** Lee ?perfil=; un valor ausente o desconocido devuelve el perfil por defecto. */
export function getProfileFromSearch(search: string): Profile {
  const id = new URLSearchParams(search).get('perfil');
  return id !== null && Object.hasOwn(PROFILES, id)
    ? PROFILES[id as Profile['id']]
    : DEFAULT_PROFILE;
}
