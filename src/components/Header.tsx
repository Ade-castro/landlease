import { Bell, ChevronDown, Menu, Sprout, X } from 'lucide-react'
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

  return <header className={scrolled ? 'topbar scrolled' : 'topbar'}>
    <Link className="brand" to="/discover"><span className="brand-mark"><Sprout size={20} /></span><span>landlease</span></Link>
    <nav className="desktop-nav">{isHost ? hostLinks : guestLinks}</nav>
    <div className="topbar-actions">
      <button className="link-reset host-toggle" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
      <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><span /></button>
      <button className="profile-button"><span className="avatar">TM</span><span className="profile-name">Tendai M.</span><ChevronDown size={15} /></button>
      <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    {menuOpen && <nav className="mobile-menu">
      {isHost ? hostLinks : guestLinks}
      <button className="link-reset host-toggle" onClick={() => navigate(isHost ? '/discover' : '/host')}>{isHost ? 'Switch to renting' : 'List your land'}</button>
    </nav>}
  </header>
}
