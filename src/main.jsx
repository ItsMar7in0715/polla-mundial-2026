import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WorldCupPolla from '../WorldCupPolla.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorldCupPolla />
  </StrictMode>,
)
