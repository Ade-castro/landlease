import { Link } from 'react-router-dom'

export function Footer() {
  return <footer className="bg-light border-top mt-auto">
    <div className="container-xxl d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 py-4 small text-secondary">
      <div className="d-flex align-items-center gap-2 fw-bold text-dark"><img src={import.meta.env.BASE_URL + 'brand/primary.png'} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} /><span>landlease</span></div>
      <span>Good ground. Good growth.</span>
      <div className="d-flex gap-4">
        <Link className="text-secondary" to="/discover#how-it-works">About</Link>
        <Link className="text-secondary" to="/help">Help centre</Link>
        <Link className="text-secondary" to="/host/new">List your land</Link>
      </div>
    </div>
  </footer>
}
