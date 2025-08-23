import chalk from '@alita/chalk'
import { createRoot } from 'react-dom/client'
import App from './views/App.tsx'
import './index.css'

(window as any).alitadebug = true
chalk.hello('zz-ui-differ', '0.0.1')

const container = document.createElement('div')
container.id = 'crxjs-app'
document.body.appendChild(container)
createRoot(container).render(
  <App />,
)
