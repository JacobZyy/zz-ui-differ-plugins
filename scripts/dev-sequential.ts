import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import process from 'node:process'

console.log('🚀 Starting UI Differ development in sequential mode...\n')

// 启动 core 包的 dev 模式
console.log('📦 Step 1: Starting Core Library...')
const coreProcess = spawn('pnpm', ['dev:core'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
})

const webTesterProcess = spawn('pnpm', ['dev:web-tester'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
})

// 等待 core 包启动完成（监听构建完成信息）
setTimeout(() => {
  console.log('\n🔄 Step 2: Core library is building, starting plugins...\n')

  // 启动 Chrome 插件
  console.log('🌐 Starting Chrome Plugin...')
  const chromeProcess = spawn('pnpm', ['dev:chrome'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  })

  // 启动 MasterGo 插件
  console.log('🎨 Starting MasterGo Plugin...')
  const mastergoProcess = spawn('pnpm', ['dev:mastergo'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  })

  // 处理进程退出
  const processes: ChildProcess[] = [coreProcess, webTesterProcess, chromeProcess, mastergoProcess]

  // 当任何一个进程退出时，终止所有进程
  processes.forEach((proc) => {
    proc.on('exit', (code, signal) => {
      console.log(`\n⚠️ Process exited with code ${code} and signal ${signal}`)
      console.log('🛑 Terminating all development processes...')

      processes.forEach((p) => {
        if (!p.killed) {
          p.kill('SIGTERM')
        }
      })

      process.exit(code || 0)
    })
  })

  // 处理 Ctrl+C 信号
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT, terminating all processes...')
    processes.forEach((proc) => {
      if (!proc.killed) {
        proc.kill('SIGTERM')
      }
    })
    process.exit(0)
  })
}, 3000) // 等待 3 秒让 core 包开始构建

// 处理 core 进程异常退出
coreProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error('❌ Core library failed to start')
    process.exit(1)
  }
})
