import { IndicatorModule } from '../modules/indicator/IndicatorModule';
import { Reel } from '../modules/reel/Reel';
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
  onComplete: () => void;
}

function ModuleView({
  moduleRef,
  configs,
  states,
  onComplete,
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
    case 'reel':
      return <Reel onComplete={onComplete} />;
    // Se implementa en el carrusel de logos.
    case 'logos':
      return null;
  }
}

export function SceneView({ scene, configs, states, onComplete }: Props) {
  return (
    <div className={scene.layout === 'halves' ? styles.halves : styles.full}>
      {scene.modules.map((moduleRef, i) => (
        <ModuleView
          key={i}
          moduleRef={moduleRef}
          configs={configs}
          states={states}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
