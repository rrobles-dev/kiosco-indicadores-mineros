import { IndicatorModule } from '../modules/indicator/IndicatorModule';
import type {
  IndicatorId,
  IndicatorModuleConfig,
  IndicatorModuleState,
} from '../types/indicators';
import type { Profile, Scene } from '../types/presentation';
import styles from './ProfileLayout.module.css';
import { SceneView } from './SceneView';
import { usePlaylist } from './usePlaylist';

interface Props {
  profile: Profile;
  configs: IndicatorModuleConfig[];
  states: Record<IndicatorId, IndicatorModuleState>;
  random?: () => number;
}

/** Ids de indicador que la escena ya muestra en la zona principal. */
function featuredIds(scene: Scene | null): Set<IndicatorId> {
  const ids = new Set<IndicatorId>();
  for (const ref of scene?.modules ?? []) {
    if (ref.kind === 'indicator') ids.add(ref.id);
  }
  return ids;
}

export function ProfileLayout({ profile, configs, states, random = Math.random }: Props) {
  const { scene, step, onComplete } = usePlaylist(profile.main, states, { random });

  // En la barra lateral se omite lo que la zona principal ya destaca; la franja los muestra todos.
  const excluded = profile.layout === 'featured-sidebar' ? featuredIds(scene) : new Set<IndicatorId>();
  const secondary = configs.filter(
    (c) => states[c.id].status !== 'empty' && !excluded.has(c.id),
  );

  return (
    <div className={`${styles.root} ${styles[profile.layout]}`} data-layout={profile.layout}>
      <main className={styles.main}>
        {scene ? (
          <SceneView key={step} scene={scene} configs={configs} states={states} onComplete={onComplete} random={random} />
        ) : (
          <p className={styles.unavailable}>Indicadores no disponibles por el momento</p>
        )}
      </main>
      <aside className={styles.secondary} aria-label="Indicadores">
        {secondary.map((config) => (
          <IndicatorModule
            key={config.id}
            config={config}
            state={states[config.id]}
            variant="minimal"
          />
        ))}
      </aside>
    </div>
  );
}
