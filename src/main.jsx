import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { GradeDataProvider } from './context/grade-data-context.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GradeDataProvider>
        <App />
      </GradeDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
