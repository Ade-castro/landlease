import { Check, MapPin, Pencil, Plus, ShieldCheck, Sprout, Trash2 } from 'lucide-react'
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
    <section className="hero host-hero">
      <div ref={heroCopyReveal.ref} className={`hero-copy ${heroCopyReveal.className}`} style={heroCopyReveal.style}>
        <p className="eyebrow"><span className="eyebrow-dot" /> HOSTING ON LANDLEASE</p>
        <h1>List your land.<br /><em>Earn every season.</em></h1>
        <p className="hero-description">Reach verified farmers searching for land right now. You set the price, the term and who leases it.</p>
        <div className="trust-row"><span><ShieldCheck size={16} /> You control the terms</span><span><Check size={16} /> Free to list</span></div>
        <button className="dark-button host-cta" onClick={() => navigate('/host/new')}><Plus size={15} /> List new land</button>
      </div>
      <div ref={heroArtReveal.ref} className={`hero-art ${heroArtReveal.className}`} style={heroArtReveal.style}><div className="hero-image" /></div>
    </section>
    <section className="content-section">
      <div className="section-heading"><div><p className="section-kicker">YOUR LAND</p><h2>Manage your listings</h2></div>{myListings.length > 0 && <button className="outline-button" onClick={() => navigate('/host/new')}><Plus size={16} /> List new land</button>}</div>
      {myListings.length === 0
        ? <div className="host-empty"><Sprout size={26} /><p>You haven't listed any land yet.</p><button className="dark-button" onClick={() => navigate('/host/new')}>List your first plot <span>→</span></button></div>
        : <div className="listing-grid">{myListings.map((listing, index) => <HostListingCard key={listing.id} listing={listing} onEdit={() => navigate(`/host/${listing.id}/edit`)} onRemove={() => onRemove(listing.id)} delay={index * 60} />)}</div>}
    </section>
  </>
}

function HostListingCard({ listing, onEdit, onRemove, delay = 0 }: { listing: Listing; onEdit: () => void; onRemove: () => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card host-listing-card ${reveal.className}`} style={reveal.style}>
    <div className="listing-image-wrap"><img src={listing.image} alt={listing.name} /><span className="live-badge">Live</span></div>
    <div className="listing-body">
      <div className="listing-title-row"><div><h3>{listing.name}</h3><p><MapPin size={13} /> {listing.area}</p></div></div>
      <div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div>
      <div className="listing-footer"><div><strong>{listing.price}</strong><small>{listing.detail}</small></div><div className="host-card-actions"><button className="icon-button" onClick={onEdit} aria-label="Edit listing"><Pencil size={15} /></button><button className="icon-button" onClick={onRemove} aria-label="Remove listing"><Trash2 size={15} /></button></div></div>
    </div>
  </article>
}
