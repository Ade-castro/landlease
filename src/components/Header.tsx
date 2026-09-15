import { Bell, Menu, Sprout, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const isHost = location.pathname.startsWith('/host')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const guestLinks = <><Link className={location.pathname === '/discover' || location.pathname === '/' ? 'active' : ''} to="/discover">Discover land</Link><Link to="/discover#how-it-works">How it works</Link><Link to="/discover#resources">Farm resources</Link></>
  const hostLinks = <Link className="active" to="/host">Your listings</Link>

  return <header className={scrolled ? 'landlease-navbar scrolled bg-white sticky-top border-bottom py-3 position-relative' : 'landlease-navbar bg-white sticky-top border-bottom py-3 position-relative'}>
    <div className="container-xxl d-flex align-items-center justify-content-between position-relative">
      <Link className="d-flex align-items-center gap-2 fw-bold fs-5 text-dark" to="/discover"><span className="brand-mark"><Sprout size={18} /></span><span>landlease</span></Link>
      <nav className="nav-links d-none d-lg-flex gap-4 position-absolute top-50 start-50 translate-middle">{isHost ? hostLinks : guestLinks}</nav>
      <div className="d-flex align-items-center gap-2">
        <button className="btn host-toggle-btn rounded-pill fw-semibold d-none d-md-inline-block" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
        <button className="icon-btn d-none d-sm-inline-flex" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
        <button className="profile-pill" aria-label="Account menu"><Menu size={16} /><span className="avatar">TM</span></button>
        <button className="icon-btn d-lg-none" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
    {menuOpen && <nav className="mobile-menu">
      {isHost ? hostLinks : guestLinks}
      <button className="nav-style text-start fw-semibold text-primary border-0 bg-transparent" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
    </nav>}
  </header>
}
