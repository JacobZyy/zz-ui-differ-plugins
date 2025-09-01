import type { Options } from 'vite-plugin-zip-pack'
import path from 'node:path'
import process from 'node:process'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import zip from 'vite-plugin-zip-pack'
import manifest from './manifest.config.js'
import { version } from './package.json'

const zipPluginOptions: Options = {
  inDir: path.resolve(__dirname, '../../dist/plugin-chrome'),
  outDir: path.resolve(__dirname, '../../dist'),
  outFileName: `plugin-chrome-${version}.zip`,
}

export default defineConfig({
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
  },
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
    tailwindcss(),
    crx({ manifest }),
    // @ts-expect-error zip plugin types are not compatible with vite 7
    zip(zipPluginOptions),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    cors: {
      origin: [
        /chrome-extension:\/\//,
      ],
    },
  },
})
