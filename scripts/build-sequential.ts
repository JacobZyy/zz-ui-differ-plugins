import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import process from 'node:process'

console.log('🏗️ Starting UI Differ build in sequential mode...\n')

// 启动 core 包的构建
console.log('📦 Step 1: Building Core Library...')
const coreProcess = spawn('pnpm', ['--filter', '@ui-differ/core', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
})

coreProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error('❌ Core library build failed')
    process.exit(1)
  }

  console.log('✅ Core library build completed\n')
  console.log('🔄 Step 2: Building plugins...\n')

  // Core 构建完成后，并行构建插件
  const chromeProcess = spawn('pnpm', ['--filter', '@ui-differ/plugin-chrome', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  })

  const mastergoProcess = spawn('pnpm', ['--filter', '@ui-differ/plugin-master-go', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  })

  const processes: ChildProcess[] = [chromeProcess, mastergoProcess]
  let completedCount = 0

  processes.forEach((proc, index) => {
    const pluginName = index === 0 ? 'Chrome Plugin' : 'MasterGo Plugin'

    proc.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ ${pluginName} build failed`)
        // 终止其他进程
        processes.forEach((p) => {
          if (!p.killed) {
            p.kill('SIGTERM')
          }
        })
        process.exit(1)
      }

      console.log(`✅ ${pluginName} build completed`)
      completedCount++

      // 所有插件构建完成
      if (completedCount === processes.length) {
        console.log('\n🎉 All builds completed successfully!')
        process.exit(0)
      }
    })
  })

  // 处理 Ctrl+C 信号
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT, terminating all build processes...')
    processes.forEach((proc) => {
      if (!proc.killed) {
        proc.kill('SIGTERM')
      }
    })
    process.exit(0)
  })
})
