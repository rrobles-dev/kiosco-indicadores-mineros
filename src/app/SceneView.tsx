import { IndicatorModule } from '../modules/indicator/IndicatorModule';
import type {
  IndicatorId,
  IndicatorModuleConfig,
  IndicatorModuleState,
} from '../types/indicators';
import type { ModuleRef, Scene } from '../types/presentation';
import styles from './SceneView.module.css';

interface Props {
  scene: Scene;
  configs: IndicatorModuleConfig[];
  states: Record<IndicatorId, IndicatorModuleState>;
}

function ModuleView({
  moduleRef,
  configs,
  states,
}: Omit<Props, 'scene'> & { moduleRef: ModuleRef }) {
  switch (moduleRef.kind) {
    case 'indicator': {
      const config = configs.find((c) => c.id === moduleRef.id);
      if (!config) return null;
      return (
        <IndicatorModule
          config={config}
          state={states[moduleRef.id]}
          variant={moduleRef.variant}
        />
      );
    }
  }
}

export function SceneView({ scene, configs, states }: Props) {
  return (
    <div className={scene.layout === 'halves' ? styles.halves : styles.full}>
      {scene.modules.map((moduleRef, i) => (
        <ModuleView key={i} moduleRef={moduleRef} configs={configs} states={states} />
      ))}
    </div>
  );
}
