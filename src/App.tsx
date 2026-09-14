import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { DiscoverPage } from './pages/DiscoverPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { HostDashboardPage } from './pages/HostDashboardPage'
import { HostWizardPage } from './pages/HostWizardPage'

function App() {
  const location = useLocation()
  return <div className="app-shell">
    <Header />
    <main id="top">
      <div key={location.pathname} className="view-transition">
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/host" element={<HostDashboardPage />} />
          <Route path="/host/new" element={<HostWizardPage />} />
          <Route path="/host/:id/edit" element={<HostWizardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </main>
    <Footer />
  </div>
}

function NotFound() {
  return <section className="content-section empty-state">Page not found.</section>
}

export default App
