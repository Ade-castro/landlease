import { Bookmark, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import type { Listing } from '../lib/types'

export function ListingCard({ listing, saved, onSave, delay = 0 }: { listing: Listing; saved: boolean; onSave: (id: number) => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card ${reveal.className}`} style={reveal.style}>
    <Link to={`/listing/${listing.id}`} className="listing-image-wrap">
      <img src={listing.image} alt={listing.name} />
      <div className="image-overlay">
        <span className="distance"><MapPin size={13} /> Harare area</span>
        <button className={saved ? 'save-button saved' : 'save-button'} onClick={(event) => { event.preventDefault(); onSave(listing.id) }} aria-label="Save listing"><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      {listing.featured && <span className="featured-badge">Featured plot</span>}
    </Link>
    <div className="listing-body">
      <div className="listing-title-row">
        <div><h3><Link to={`/listing/${listing.id}`}>{listing.name}</Link></h3><p><MapPin size={13} /> {listing.area}</p></div>
        <span className="verified"><ShieldCheck size={15} /></span>
      </div>
      <div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div>
      <div className="listing-footer"><div><strong>{listing.price}</strong><small>{listing.detail}</small></div><div className="tags">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
    </div>
  </article>
}
