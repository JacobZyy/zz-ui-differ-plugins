import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: '转转ui自动化走查工具',
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://*.zhuanzhuan.com/*', 'http://localhost:*/*', 'http://127.0.0.1:*/*'],
  }],
  permissions: [
    'activeTab',
    'scripting',
    'storage',
    'webRequest',
    'debugger',
    'tabs',
    'windows',
  ],
  host_permissions: [
    'https://*/*',
    'http://*/*',
  ],
})
