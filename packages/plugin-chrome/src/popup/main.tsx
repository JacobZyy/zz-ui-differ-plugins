import { ConfigProvider } from 'antd'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ConfigProvider theme={{ cssVar: true }}>
    <App />
  </ConfigProvider>,
)
