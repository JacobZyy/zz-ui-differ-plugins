import { sendMsgToPlugin, UIMessage } from '@messages/sender'
import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [mg] = useState('MasterGo')

  useEffect(() => {
    sendMsgToPlugin({
      type: UIMessage.HELLO,
      data: 'hello',
    })
  }, [])

  return (
    <div className="hello">
      Hello
      {mg}
    </div>
  )
}
export default App
