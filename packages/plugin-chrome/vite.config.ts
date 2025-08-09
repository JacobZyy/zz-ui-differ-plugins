import path from 'node:path'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { version } from './package.json'

export default defineConfig({
  resolve: {
    alias: {
      '@': `${path.resolve(__dirname, 'src')}`,
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/plugin-chrome'),
    emptyOutDir: false,
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({
      inDir: path.resolve(__dirname, '../../dist/plugin-chrome'),
      outDir: path.resolve(__dirname, '../../dist'),
      outFileName: `plugin-chrome-${version}.zip`,
    }),
  ],
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})
