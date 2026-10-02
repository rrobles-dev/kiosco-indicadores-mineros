import { ProfileLayout } from './app/ProfileLayout'
import { useIndicators, type UseIndicatorsDeps } from './app/useIndicators'
import { INDICATOR_MODULES } from './config/modules'
import { findicAdapter } from './data/adapters/findic'
import { mindicadorAdapter } from './data/adapters/mindicador'
import { createReadingCache } from './data/cache'
import { sleep } from './lib/sleep'
import { getProfileFromSearch } from './presentation/profile'

const deps: UseIndicatorsDeps = {
  configs: INDICATOR_MODULES,
  adapters: { mindicador: mindicadorAdapter, findic: findicAdapter },
  cache: createReadingCache(window.localStorage),
  now: () => new Date(),
  sleep,
  timeoutMs: 8000,
  retryDelaysMs: [2000, 4000, 8000],
}

const profile = getProfileFromSearch(window.location.search)

function App() {
  const states = useIndicators(deps)

  return <ProfileLayout profile={profile} configs={INDICATOR_MODULES} states={states} />
}

export default App
