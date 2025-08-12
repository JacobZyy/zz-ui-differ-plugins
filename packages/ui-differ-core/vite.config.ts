import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig({
  plugins: [
    dts({
      // 生成类型声明文件
      insertTypesEntry: true,
      // 包含源码目录
      include: ['src/**/*'],
      // 排除测试文件等
      exclude: ['**/*.test.*', '**/*.spec.*'],
    }),
  ],
  build: {
    lib: {
      // 入口文件
      entry: resolve(__dirname, 'src/index.ts'),
      // 库名称
      name: pkg.name,
      // 文件名称
      fileName: 'index',
      // 格式
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      // 确保外部化那些你不想打包进库的依赖
      external: [],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {},
      },
    },
    // 生成类型声明文件
    sourcemap: process.env.NODE_ENV === 'development',
    // 清理输出目录
    emptyOutDir: true,
    // 输出目录
    outDir: 'dist',
    // 目标环境
    target: 'esnext',
  },
  // TypeScript 配置
  esbuild: {
    target: 'esnext',
  },
})
