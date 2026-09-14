import { ArrowLeft, Bookmark, Check, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'

export function ListingDetailPage() {
  const { id } = useParams()
  const { getListing, saved, toggleSaved } = useListings()
  const { show } = useToast()
  const listing = getListing(Number(id))

  if (!listing) {
    return <section className="content-section">
      <p>We couldn't find that listing — it may have been removed.</p>
      <Link className="link-reset detail-back" to="/discover"><ArrowLeft size={15} /> Back to Discover land</Link>
    </section>
  }

  const isSaved = saved.includes(listing.id)
  return <section className="content-section listing-detail">
    <Link className="link-reset detail-back" to="/discover"><ArrowLeft size={15} /> Back to Discover land</Link>
    <div className="detail-layout">
      <div className="detail-media"><img src={listing.image} alt={listing.name} />{listing.featured && <span className="featured-badge">Featured plot</span>}</div>
      <div className="detail-main">
        <div className="detail-heading"><div><h1>{listing.name}</h1><p><MapPin size={14} /> {listing.area}</p></div><span className="verified"><ShieldCheck size={17} /></span></div>
        <div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div>
        <div className="tags">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        {listing.description && <p className="detail-description">{listing.description}</p>}
      </div>
      <aside className="detail-card">
        <strong>{listing.price}</strong>
        <small>{listing.detail}</small>
        <button className={isSaved ? 'dark-button' : 'outline-button'} onClick={() => { toggleSaved(listing.id); show(isSaved ? 'Removed from saved.' : 'Saved to your list.') }}><Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save this plot'}</button>
        <button className="outline-button" onClick={() => show('This is a demo — landowner contact isn’t wired up yet.')}>Contact landowner</button>
        <div className="detail-trust"><span><ShieldCheck size={14} /> Verified landowner</span><span><Check size={14} /> Simple, secure lease</span></div>
      </aside>
    </div>
  </section>
}
