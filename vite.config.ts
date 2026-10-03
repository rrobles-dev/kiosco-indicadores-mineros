import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // En GitHub Pages el sitio vive en una subruta (D-27).
  base: process.env.GITHUB_PAGES === 'true' ? '/kiosco-indicadores-mineros/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
