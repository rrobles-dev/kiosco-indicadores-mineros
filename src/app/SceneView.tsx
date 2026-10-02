import { MEMBERS } from '../config/members';
import { IndicatorModule } from '../modules/indicator/IndicatorModule';
import { Logos } from '../modules/logos/Logos';
import { Video } from '../modules/video/Video';
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
  random: () => number;
}

function ModuleView({
  moduleRef,
  configs,
  states,
  onComplete,
  random,
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
    case 'video':
      return <Video onComplete={onComplete} />;
    case 'logos':
      return <Logos members={MEMBERS} random={random} onComplete={onComplete} />;
  }
}

export function SceneView({ scene, configs, states, onComplete, random }: Props) {
  return (
    <div className={scene.layout === 'halves' ? styles.halves : styles.full}>
      {scene.modules.map((moduleRef, i) => (
        <ModuleView
          key={i}
          moduleRef={moduleRef}
          configs={configs}
          states={states}
          onComplete={onComplete}
          random={random}
        />
      ))}
    </div>
  );
}
