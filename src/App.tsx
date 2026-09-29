import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { DiscoverPage } from './pages/DiscoverPage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { HostDashboardPage } from './pages/HostDashboardPage'
import { HostWizardPage } from './pages/HostWizardPage'
import { SavedPage } from './pages/SavedPage'
import { AccountPage } from './pages/AccountPage'
import { FarmVisitPage } from './pages/FarmVisitPage'
import { NegotiationPage } from './pages/NegotiationPage'
import { NegotiationPreviewPage } from './pages/NegotiationPreviewPage'
import { MyVisitsPage } from './pages/MyVisitsPage'
import { AdminReviewPage } from './pages/AdminReviewPage'

const WorkspacePage = lazy(() => import('./platform/WorkspacePage').then(module => ({ default: module.WorkspacePage })))
const ContractPage = lazy(() => import('./platform/ContractPage').then(module => ({ default: module.ContractPage })))
const PresentationDemoPage = lazy(() => import('./platform/PresentationDemoPage').then(module => ({ default: module.PresentationDemoPage })))

const DirectoryPage = lazy(() => import('./platform/DirectoryPage').then(module => ({ default: module.DirectoryPage })))

function App() {
  const location = useLocation()
  return <div className="app-shell d-flex flex-column min-vh-100">
    <Header />
    <main id="top" className="flex-grow-1">
      <div key={location.pathname} className="view-transition">
        <Suspense fallback={<section className="container py-5">Loading page…</section>}><Routes location={location}>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/listing/:id/visit" element={<FarmVisitPage />} />
          <Route path="/negotiation/:visitId" element={<NegotiationPage />} />
          <Route path="/negotiation-preview" element={<NegotiationPreviewPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/contract/:id" element={<ContractPage />} />
          <Route path="/demo" element={<PresentationDemoPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/my-visits" element={<MyVisitsPage />} />
          <Route path="/admin/review" element={<AdminReviewPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/host" element={<HostDashboardPage />} />
          <Route path="/host/new" element={<HostWizardPage />} />
          <Route path="/host/:id/edit" element={<HostWizardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes></Suspense>
      </div>
    </main>
    <Footer />
  </div>
}

function NotFound() {
  return <section className="container-xxl py-5 text-center text-secondary">Page not found.</section>
}

export default App
