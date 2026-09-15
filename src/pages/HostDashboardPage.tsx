import { MapPin, Pencil, Plus, Sprout, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'
import type { Listing } from '../lib/types'

export function HostDashboardPage() {
  const { myListings, remove } = useListings()
  const { show } = useToast()
  const navigate = useNavigate()
  const heroCopyReveal = useReveal<HTMLDivElement>()
  const heroArtReveal = useReveal<HTMLDivElement>(120)

  const onRemove = (id: number) => { remove(id); show('Listing removed.') }

  return <>
    <section className="container-xxl py-5">
      <div className="row align-items-center g-5">
        <div ref={heroCopyReveal.ref} className={`col-lg-6 ${heroCopyReveal.className}`} style={heroCopyReveal.style}>
          <p className="text-primary fw-bold small text-uppercase mb-2" style={{ letterSpacing: '.1em' }}>Hosting on landlease</p>
          <h1 className="hero-heading mb-3">List your land.<br />Earn every <span className="accent">season</span>.</h1>
          <p className="text-secondary fs-5 mb-4" style={{ maxWidth: 440 }}>Reach verified farmers searching for land right now. You set the price, the term and who leases it.</p>
          <button className="btn btn-primary rounded-pill fw-semibold px-4 py-2 d-inline-flex align-items-center gap-2" onClick={() => navigate('/host/new')}><Plus size={16} /> List new land</button>
        </div>
        <div ref={heroArtReveal.ref} className={`col-lg-6 ${heroArtReveal.className}`} style={heroArtReveal.style}>
          <div className="hero-photo" style={{ height: 340 }}><img src="https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1200&q=85" alt="Aerial view of farmland" /></div>
        </div>
      </div>
    </section>
    <section className="container-xxl pb-5">
      <div className="d-flex align-items-baseline justify-content-between mb-4">
        <h2 className="fw-bold mb-0">Manage your listings</h2>
        {myListings.length > 0 && <button className="btn btn-outline-dark rounded-pill d-flex align-items-center gap-2" onClick={() => navigate('/host/new')}><Plus size={16} /> List new land</button>}
      </div>
      {myListings.length === 0
        ? <div className="host-empty text-center text-secondary py-5">
          <Sprout size={26} className="text-primary mb-2" />
          <p className="mb-3">You haven't listed any land yet.</p>
          <button className="btn btn-primary rounded-pill" onClick={() => navigate('/host/new')}>List your first plot →</button>
        </div>
        : <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">{myListings.map((listing, index) => <div className="col" key={listing.id}><HostListingCard listing={listing} onEdit={() => navigate(`/host/${listing.id}/edit`)} onRemove={() => onRemove(listing.id)} delay={index * 60} /></div>)}</div>}
    </section>
  </>
}

function HostListingCard({ listing, onEdit, onRemove, delay = 0 }: { listing: Listing; onEdit: () => void; onRemove: () => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card-ab ${reveal.className}`} style={reveal.style}>
    <div className="listing-media"><img src={listing.image} alt={listing.name} /><span className="live-badge">Live</span></div>
    <div className="pt-2">
      <h3 className="listing-title mb-1 text-truncate">{listing.name}</h3>
      <p className="text-secondary small mb-1 d-flex align-items-center gap-1"><MapPin size={12} /> {listing.area}</p>
      <p className="text-secondary small mb-1">{listing.size} · {listing.crop}</p>
      <div className="d-flex align-items-end justify-content-between mt-2">
        <div><strong>{listing.price}</strong><div className="text-secondary small">{listing.detail}</div></div>
        <div className="d-flex gap-1">
          <button className="icon-btn" onClick={onEdit} aria-label="Edit listing"><Pencil size={15} /></button>
          <button className="icon-btn" onClick={onRemove} aria-label="Remove listing"><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  </article>
}
