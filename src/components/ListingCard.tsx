import { Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import type { Listing } from '../lib/types'

export function ListingCard({ listing, saved, onSave, delay = 0 }: { listing: Listing; saved: boolean; onSave: (id: number) => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card-ab ${reveal.className}`} style={reveal.style}>
    <Link to={`/listing/${listing.id}`} className="listing-media">
      <img src={listing.image} alt={listing.name} />
      <button className={saved ? 'wishlist-btn saved' : 'wishlist-btn'} onClick={(event) => { event.preventDefault(); onSave(listing.id) }} aria-label="Save listing"><Heart size={20} fill={saved ? 'currentColor' : 'none'} /></button>
      {listing.featured && <span className="badge-guest">Guest favourite</span>}
    </Link>
    <div className="pt-2">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <h3 className="listing-title mb-0 text-truncate"><Link to={`/listing/${listing.id}`} className="text-dark">{listing.name}</Link></h3>
        {listing.rating && <span className="listing-rating"><Star size={13} fill="currentColor" /> {listing.rating}</span>}
      </div>
      <p className="text-secondary small mb-1 d-flex align-items-center gap-1"><MapPin size={12} /> {listing.area}</p>
      <p className="text-secondary small mb-1">{listing.size} · {listing.crop}</p>
      <p className="mb-1"><strong>{listing.price}</strong> <span className="text-secondary small">{listing.detail}</span></p>
      <div className="listing-tags d-flex flex-wrap gap-1">{listing.tags.map((tag) => <span key={tag} className="badge rounded-pill fw-normal">{tag}</span>)}</div>
    </div>
  </article>
}
