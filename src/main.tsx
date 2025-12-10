import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // 确保样式被引入

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)