import type { BuildOptions, PluginOption, UserConfig } from 'vite'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { viteSingleFile } from 'vite-plugin-singlefile'
import manifest from './manifest.json'

const target = process.env.TARGET

// 复制并更新manifest.json的插件
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      const outputDir = resolve(__dirname, '../../dist/plugin-ui-differ-master-go')
      const manifestDest = resolve(outputDir, 'manifest.json')

      // 确保输出目录存在
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true })
      }

      // 读取并更新manifest.json
      const updatedManifest = {
        ...manifest,
        main: 'main.js',
        ui: 'index.html',
      }

      // 写入更新后的manifest.json
      writeFileSync(manifestDest, JSON.stringify(updatedManifest, null, 2))
    },
  }
}

export default defineConfig(() => {
  const uiBuildConfig: BuildOptions = {
    target: 'esnext',
  }
  const libBuildConfig: BuildOptions = {
    lib: {
      entry: resolve(__dirname, './lib/main.ts'),
      name: 'myLib',
      formats: ['umd'],
      fileName: () => `main.js`,
    },
  }

  const buildConfig: BuildOptions = target === 'ui' ? uiBuildConfig : libBuildConfig

  const uiPlugins = [
    viteSingleFile({
      useRecommendedBuildConfig: true,
      removeViteModuleLoader: true,
      deleteInlinedFiles: true,
    }),
    createHtmlPlugin(),
  ] as PluginOption[]

  const plugins = target === 'ui' ? uiPlugins : []

  const config: UserConfig = {
    plugins: [
      tailwindcss(),
      react(),
      copyManifestPlugin(),
      ...plugins,
    ],
    build: {
      ...buildConfig,
      outDir: resolve(__dirname, '../../dist/plugin-ui-differ-master-go'),
      emptyOutDir: false,
    },
    resolve: {
      alias: {
        '@lib': resolve(__dirname, './lib'),
        '@ui': resolve(__dirname, './ui'),
        '@messages': resolve(__dirname, './messages'),
      },
    },
  }
  return config
})
