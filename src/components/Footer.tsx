import { Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return <footer>
    <div className="footer-brand"><span className="brand-mark"><Sprout size={17} /></span><span>landlease</span></div>
    <span>Good ground. Good growth.</span>
    <div className="footer-links"><Link to="/discover#how-it-works">About</Link><Link to="/discover#resources">Help centre</Link><Link to="/host/new">List your land</Link></div>
  </footer>
}
