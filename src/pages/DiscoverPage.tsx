import { Carrot, ChevronDown, Search, Sprout, TreeDeciduous, Wheat } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useReveal } from '../hooks/useReveal'
import { categories } from '../lib/data'
import { useListings } from '../context/ListingsContext'

const CATEGORY_ICONS: Record<string, ComponentType<{ size?: number }>> = { 'All land': Sprout, Vegetables: Carrot, Grains: Wheat, Orchards: TreeDeciduous }

export function DiscoverPage() {
  const { listings, saved, toggleSaved } = useListings()
  const [category, setCategory] = useState('All land')
  const [query, setQuery] = useState('')
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  const visible = useMemo(() => listings.filter((item) => {
    const text = `${item.name} ${item.area} ${item.crop}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const categoryMatch = category === 'All land' || item.category === category
    return queryMatch && categoryMatch
  }), [category, query, listings])

  const heroCopyReveal = useReveal<HTMLDivElement>()
  const heroArtReveal = useReveal<HTMLDivElement>(120)

  return <>
    <section className="container-xxl py-5" id="discover">
      <div className="row align-items-center g-5">
        <div ref={heroCopyReveal.ref} className={`col-lg-6 ${heroCopyReveal.className}`} style={heroCopyReveal.style}>
          <h1 className="hero-heading mb-3">Find your patch.<br />Grow your <span className="accent">future</span>.</h1>
          <p className="text-secondary fs-5 mb-4" style={{ maxWidth: 440 }}>Verified farmland for your next season, with the tools and support to make it thrive.</p>
        </div>
        <div ref={heroArtReveal.ref} className={`col-lg-6 ${heroArtReveal.className}`} style={heroArtReveal.style}>
          <div className="hero-photo" style={{ height: 340 }}>
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85" alt="Farmland at sunset" />
            <span className="hero-photo-badge">Est. 2026 · Zimbabwe</span>
          </div>
        </div>
      </div>
    </section>

    <section className="container-xxl pb-4" aria-label="Search farmland">
      <div className="search-pill">
        <button className="search-segment d-none d-sm-block"><span className="segment-label">Where</span><span className="segment-value d-flex align-items-center gap-1">Harare &amp; surrounds <ChevronDown size={13} /></span></button>
        <span className="search-divider d-none d-sm-block" />
        <div className="search-segment"><label className="segment-label" htmlFor="crop-search">Growing</label><input id="crop-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Crop, land name or area" /></div>
        <button className="search-submit" aria-label="Search"><Search size={18} /></button>
      </div>
    </section>

    <section className="container-xxl border-bottom pb-1">
      <div className="category-bar d-flex gap-4 overflow-auto">
        {categories.map((item) => {
          const Icon = CATEGORY_ICONS[item]
          return <button key={item} className={category === item ? 'category-item active' : 'category-item'} onClick={() => setCategory(item)}><Icon size={22} /><span>{item}</span></button>
        })}
      </div>
    </section>

    <section className="container-xxl py-5">
      <div className="d-flex align-items-baseline justify-content-between mb-4">
        <h2 className="fw-bold mb-0">Land ready to grow on</h2>
        <span className="text-secondary small">{visible.length} of {listings.length} listings</span>
      </div>
      <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
        {visible.map((listing, index) => <div className="col" key={listing.id}><ListingCard listing={listing} saved={saved.includes(listing.id)} onSave={toggleSaved} delay={index * 60} /></div>)}
      </div>
      {visible.length === 0 && <div className="text-center text-secondary py-5">No plots match that search yet. Try a broader crop or area.</div>}
    </section>

    <section className="bg-dark text-white py-5" id="resources">
      <div className="container-xxl">
        <p className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: '.12em', color: '#d9ef87' }}>From lease to harvest</p>
        <h2 id="how-it-works" className="fw-bold display-6 mb-3">More than land. A head start.</h2>
        <p className="text-white-50 mb-4" style={{ maxWidth: 480 }}>Know what to plant, when to plant it, and where to find what you need. Your farm plan starts the moment you find your field.</p>
        <button className="btn btn-light rounded-pill fw-semibold">Explore farm planning →</button>
      </div>
    </section>
  </>
}
