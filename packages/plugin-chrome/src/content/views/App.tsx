import { FloatButton } from 'antd'
import DomInfoGetter from '../components/DomInfoGetter'
import '@/content/icon.css'

const App: React.FC = () => {
  return (
    <FloatButton.Group shape="circle">
      <DomInfoGetter />
    </FloatButton.Group>
  )
}

export default App
