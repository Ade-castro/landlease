import { Bell, BellOff, Heart, HelpCircle, LogOut, Menu, Sprout, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { show } = useToast()
  const isHost = location.pathname.startsWith('/host')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState<'none' | 'bell' | 'profile'>('none')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setMenuOpen(false); setOpenPanel('none') }, [location.pathname])
  useEffect(() => {
    if (openPanel === 'none') return
    const onClick = (event: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpenPanel('none') }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenPanel('none') }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [openPanel])

  const guestLinks = <><Link className={location.pathname === '/discover' || location.pathname === '/' ? 'active' : ''} to="/discover">Discover land</Link><Link to="/discover#how-it-works">How it works</Link><Link to="/discover#resources">Farm resources</Link></>
  const hostLinks = <Link className="active" to="/host">Your listings</Link>

  return <header className={scrolled ? 'landlease-navbar scrolled bg-white sticky-top border-bottom py-3 position-relative' : 'landlease-navbar bg-white sticky-top border-bottom py-3 position-relative'}>
    <div className="container-xxl d-flex align-items-center justify-content-between position-relative" ref={panelRef}>
      <Link className="d-flex align-items-center gap-2 fw-bold fs-5 text-dark" to="/discover"><span className="brand-mark"><Sprout size={18} /></span><span>landlease</span></Link>
      <nav className="nav-links d-none d-lg-flex gap-4 position-absolute top-50 start-50 translate-middle">{isHost ? hostLinks : guestLinks}</nav>
      <div className="d-flex align-items-center gap-2">
        <button className="btn host-toggle-btn rounded-pill fw-semibold d-none d-md-inline-block" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>

        <div className="position-relative d-none d-sm-block">
          <button className="icon-btn" aria-label="Notifications" aria-expanded={openPanel === 'bell'} onClick={() => setOpenPanel(openPanel === 'bell' ? 'none' : 'bell')}><Bell size={18} />{openPanel !== 'bell' && <span className="notification-dot" />}</button>
          {openPanel === 'bell' && <div className="dropdown-panel dropdown-panel-end">
            <p className="fw-bold mb-3">Notifications</p>
            <div className="text-center text-secondary py-3">
              <BellOff size={22} className="mb-2" />
              <p className="small mb-0">You're all caught up — no new notifications.</p>
            </div>
          </div>}
        </div>

        <div className="position-relative">
          <button className="profile-pill" aria-label="Account menu" aria-expanded={openPanel === 'profile'} onClick={() => setOpenPanel(openPanel === 'profile' ? 'none' : 'profile')}><Menu size={16} /><span className="avatar">TM</span></button>
          {openPanel === 'profile' && <div className="dropdown-panel dropdown-panel-end">
            <button className="dropdown-item" onClick={() => navigate('/saved')}><Heart size={16} /> Saved plots</button>
            <button className="dropdown-item" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
            <button className="dropdown-item" onClick={() => navigate('/discover#resources')}><HelpCircle size={16} /> Help centre</button>
            <hr className="my-2" />
            <button className="dropdown-item" onClick={() => { setOpenPanel('none'); show('This is a demo — accounts aren’t wired up yet.') }}><LogOut size={16} /> Log out</button>
          </div>}
        </div>

        <button className="icon-btn d-lg-none" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
    {menuOpen && <nav className="mobile-menu">
      {isHost ? hostLinks : guestLinks}
      <button className="nav-style text-start fw-semibold text-primary border-0 bg-transparent" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
    </nav>}
  </header>
}
