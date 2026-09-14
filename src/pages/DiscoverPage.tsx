import { Check, ChevronDown, Filter, MapPin, Search, ShieldCheck, Sprout, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useReveal } from '../hooks/useReveal'
import { categories } from '../lib/data'
import { useListings } from '../context/ListingsContext'

export function DiscoverPage() {
  const { listings, saved, toggleSaved } = useListings()
  const [category, setCategory] = useState('All land')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    target?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  const visible = useMemo(() => listings.filter((item) => {
    const text = `${item.name} ${item.area} ${item.crop}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const categoryMatch = category === 'All land' || item.crop.toLowerCase().includes(category.slice(0, -1).toLowerCase())
    return queryMatch && categoryMatch
  }), [category, query, listings])

  const heroCopyReveal = useReveal<HTMLDivElement>()
  const heroArtReveal = useReveal<HTMLDivElement>(120)
  const searchReveal = useReveal<HTMLElement>(160)
  const planningArtReveal = useReveal<HTMLDivElement>()
  const planningCopyReveal = useReveal<HTMLDivElement>(120)

  return <>
    <section className="hero" id="discover">
      <div ref={heroCopyReveal.ref} className={`hero-copy ${heroCopyReveal.className}`} style={heroCopyReveal.style}>
        <p className="eyebrow"><span className="eyebrow-dot" /> THE GROUND IS WAITING</p>
        <h1>Find your patch.<br /><em>Grow your future.</em></h1>
        <p className="hero-description">Verified farmland for your next season, with the tools and support to make it thrive.</p>
        <div className="trust-row"><span><ShieldCheck size={16} /> Verified landowners</span><span><Check size={16} /> Simple, secure leases</span></div>
      </div>
      <div ref={heroArtReveal.ref} className={`hero-art ${heroArtReveal.className}`} style={heroArtReveal.style}>
        <div className="hero-image" />
        <div className="hero-stamp"><span>FIELD</span><strong>02</strong><span>FIND YOURS</span></div>
        <div className="hero-caption"><span className="caption-line" /> <span>Est. 2026 / Zimbabwe</span></div>
      </div>
    </section>
    <section ref={searchReveal.ref} className={`search-panel ${searchReveal.className}`} style={searchReveal.style} aria-label="Search farmland">
      <div className="search-field"><MapPin size={19} /><div><label>Where do you want to farm?</label><button>Harare &amp; surrounds <ChevronDown size={14} /></button></div></div>
      <div className="search-divider" />
      <div className="search-field"><Sprout size={19} /><div><label>What are you growing?</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Crop, land name or area" /></div></div>
      <button className="search-button"><Search size={19} /><span>Search</span></button>
    </section>
    <section className="content-section">
      <div className="section-heading"><div><p className="section-kicker">CURATED FOR YOU</p><h2>Land ready to grow on</h2></div><button className="outline-button" onClick={() => setFilters(!filters)}><Filter size={16} /> Filters <span className="filter-count">3</span></button></div>
      <div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}<span className="result-count">{visible.length} of {listings.length} listings</span></div>
      {filters && <div className="filter-tray"><span><ShieldCheck size={16} /> Verified only</span><span><Sprout size={16} /> Soil report</span><span>Under $200 / month</span><button onClick={() => setFilters(false)} aria-label="Close filters"><X size={16} /></button></div>}
      <div className="listing-grid">{visible.map((listing, index) => <ListingCard key={listing.id} listing={listing} saved={saved.includes(listing.id)} onSave={toggleSaved} delay={index * 60} />)}</div>
      {visible.length === 0 && <div className="empty-state">No plots match that search yet. Try a broader crop or area.</div>}
      <button className="load-more">View all available land <span>→</span></button>
    </section>
    <section className="planning-section" id="resources">
      <div ref={planningArtReveal.ref} className={`planning-art ${planningArtReveal.className}`} style={planningArtReveal.style}><div className="planning-circle">01</div><div className="field-lines" /></div>
      <div ref={planningCopyReveal.ref} className={`planning-copy ${planningCopyReveal.className}`} style={planningCopyReveal.style}>
        <p className="section-kicker">FROM LEASE TO HARVEST</p>
        <h2 id="how-it-works">More than land.<br /><em>A head start.</em></h2>
        <p>Know what to plant, when to plant it, and where to find what you need. Your farm plan starts the moment you find your field.</p>
        <button className="dark-button">Explore farm planning <span>↗</span></button>
        <div className="planning-points"><span><Check size={15} /> Crop guidance</span><span><Check size={15} /> Seasonal plans</span><span><Check size={15} /> Local suppliers</span></div>
      </div>
    </section>
  </>
}
