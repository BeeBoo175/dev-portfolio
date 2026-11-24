import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './index.css'
import App from './App.tsx'
import { fontsReady } from './fontsReady'

// iOS Safari only shows :active styles once the page listens for touches
document.addEventListener('touchstart', () => {}, { passive: true })

// the first layout waits for the fonts (briefly), so text does not change shape once shown
fontsReady().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
