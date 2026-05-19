import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { registerSW } from 'virtual:pwa-register'

// SW 등록 — 새 버전 배포 시 사용자에게 업데이트 알림
registerSW({
  onNeedRefresh() {
    if (window.confirm('새 버전이 있습니다. 지금 업데이트 하시겠습니까?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('[PWA] 오프라인 사용 준비 완료')
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
