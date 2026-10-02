import './App.css'
import { useIndicators, type UseIndicatorsDeps } from './app/useIndicators'
import { INDICATOR_MODULES } from './config/modules'
import { findicAdapter } from './data/adapters/findic'
import { mindicadorAdapter } from './data/adapters/mindicador'
import { createReadingCache } from './data/cache'
import { sleep } from './lib/sleep'
import { IndicatorModule } from './modules/indicator/IndicatorModule'

const deps: UseIndicatorsDeps = {
  configs: INDICATOR_MODULES,
  adapters: { mindicador: mindicadorAdapter, findic: findicAdapter },
  cache: createReadingCache(window.localStorage),
  now: () => new Date(),
  sleep,
  timeoutMs: 8000,
  retryDelaysMs: [2000, 4000, 8000],
}

function App() {
  const states = useIndicators(deps)

  return (
    <main className="grid">
      {INDICATOR_MODULES.map((config) => (
        <IndicatorModule key={config.id} config={config} state={states[config.id]} />
      ))}
    </main>
  )
}

export default App
