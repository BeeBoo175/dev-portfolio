/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // the palette test reads the real stylesheet; Vitest blanks CSS unless told otherwise
    css: { include: [/index\.css/] },
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome100',
    chunkSizeWarningLimit: 1000,
    // ships the notices that bundled packages' licences ask for, kept in step with what is bundled
    license: { fileName: 'third-party-licenses.md' },
    rolldownOptions: {
      output: {
        codeSplitting: {
          // react only: a hand-made three.js group also captured shared helpers, which made the first
          // paint download all of three.js. Left alone, it stays with the lazily loaded scene.
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
})