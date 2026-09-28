import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './theme.scss'
import './styles.css'
import App from './App.tsx'
import { ListingsProvider } from './context/ListingsContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { FlowProvider } from './context/FlowContext.tsx'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <FlowProvider>
        <ListingsProvider>
          <App />
        </ListingsProvider>
        </FlowProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
