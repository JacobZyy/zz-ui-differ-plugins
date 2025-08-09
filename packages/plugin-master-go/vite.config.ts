import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { BuildOptions, defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { viteSingleFile } from 'vite-plugin-singlefile'

const target = process.env.TARGET

// 复制并更新manifest.json的插件
const copyManifestPlugin = () => ({
  name: 'copy-manifest',
  writeBundle() {
    const outputDir = resolve(__dirname, '../../dist/plugin-ui-differ-master-go')
    const manifestSrc = resolve(__dirname, 'manifest.json')
    const manifestDest = resolve(outputDir, 'manifest.json')
    
    // 确保输出目录存在
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }
    
    // 读取并更新manifest.json
    const manifestContent = require(manifestSrc)
    const updatedManifest = {
      ...manifestContent,
      main: 'main.js',
      ui: 'index.html'
    }
    
    // 写入更新后的manifest.json
    require('fs').writeFileSync(manifestDest, JSON.stringify(updatedManifest, null, 2))
  }
})

export default defineConfig(() => {
  const buildConfig = target === 'ui'
    ? {
        target: 'esnext',
      }
    : {
        lib: {
          entry: resolve(__dirname, './lib/main.ts'),
          name: 'myLib',
          formats: ['umd'],
          fileName: () => `main.js`,
        },
      }

  const config = {
    plugins: [
      react(),
      ...(target === 'ui'
        ? [
            viteSingleFile({
              useRecommendedBuildConfig: true,
              removeViteModuleLoader: true,
              deleteInlinedFiles: true,
            }),
            createHtmlPlugin(),
          ]
        : []),
      copyManifestPlugin(),
    ],
    build: {
      ...(buildConfig as BuildOptions),
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
