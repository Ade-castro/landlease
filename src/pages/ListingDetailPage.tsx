import { ArrowLeft, Heart, MapPin, ShieldCheck, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'

export function ListingDetailPage() {
  const { id } = useParams()
  const { getListing, saved, toggleSaved } = useListings()
  const { show } = useToast()
  const listing = getListing(Number(id))

  if (!listing) {
    return <section className="container-xxl py-5">
      <p>We couldn't find that listing — it may have been removed.</p>
      <Link className="d-inline-flex align-items-center gap-2 fw-semibold text-primary" to="/discover"><ArrowLeft size={15} /> Back to Discover land</Link>
    </section>
  }

  const isSaved = saved.includes(listing.id)
  return <section className="container-xxl py-4 py-lg-5">
    <Link className="d-inline-flex align-items-center gap-2 fw-semibold text-dark mb-4" to="/discover"><ArrowLeft size={15} /> Back to Discover land</Link>
    <div className="row g-4 g-lg-5">
      <div className="col-lg-8">
        <div className="detail-media mb-4">
          <img src={listing.image} alt={listing.name} />
          {listing.featured && <span className="badge-guest">Guest favourite</span>}
        </div>
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="fw-bold mb-1">{listing.name}</h1>
            <p className="text-secondary d-flex align-items-center gap-1 mb-0"><MapPin size={14} /> {listing.area}</p>
          </div>
          <span className="icon-btn flex-shrink-0" aria-hidden><ShieldCheck size={18} className="text-success" /></span>
        </div>
        <div className="d-flex align-items-center gap-2 text-secondary small mt-3">
          <span>{listing.size}</span><span>·</span><span>{listing.crop}</span>
          {listing.rating && <><span>·</span><span className="listing-rating text-dark"><Star size={13} fill="currentColor" /> {listing.rating}</span></>}
        </div>
        <div className="d-flex flex-wrap gap-2 mt-3">{listing.tags.map((tag) => <span key={tag} className="badge rounded-pill text-bg-light border fw-normal">{tag}</span>)}</div>
        {listing.description && <p className="text-secondary mt-4" style={{ maxWidth: 560, lineHeight: 1.75 }}>{listing.description}</p>}
      </div>
      <aside className="col-lg-4">
        <div className="detail-card border p-4">
          <strong className="fs-3">{listing.price}</strong>
          <div className="text-secondary small mb-3">{listing.detail}</div>
          <button className={isSaved ? 'btn btn-dark rounded-pill w-100 mb-2 d-flex align-items-center justify-content-center gap-2' : 'btn btn-outline-dark rounded-pill w-100 mb-2 d-flex align-items-center justify-content-center gap-2'} onClick={() => { toggleSaved(listing.id); show(isSaved ? 'Removed from saved.' : 'Saved to your list.') }}><Heart size={15} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Saved' : 'Save this plot'}</button>
          <button className="btn btn-primary rounded-pill w-100" onClick={() => show('This is a demo — landowner contact isn’t wired up yet.')}>Contact landowner</button>
          <div className="border-top mt-3 pt-3 d-flex flex-column gap-2 small fw-semibold text-success">
            <span className="d-flex align-items-center gap-2"><ShieldCheck size={14} /> Verified landowner</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
}
