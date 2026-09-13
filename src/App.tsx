import { useMemo, useState } from 'react'
import { Bell, Bookmark, Check, ChevronDown, Filter, MapPin, Menu, Search, ShieldCheck, Sprout, X } from 'lucide-react'

type Listing = { id: number; name: string; area: string; size: string; price: string; detail: string; crop: string; image: string; tags: string[]; featured?: boolean }
const listings: Listing[] = [
  { id: 1, name: 'Mbare Greenbelt Plot', area: 'Harare South, Harare', size: '2.4 hectares', price: '$180 / season', detail: 'Jun - Nov 2026', crop: 'Leafy greens', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=85', tags: ['Borehole', 'Fenced'], featured: true },
  { id: 2, name: 'Chitungwiza Orchard Land', area: 'Manyame, Mashonaland East', size: '1.8 hectares', price: '$95 / month', detail: 'Flexible term', crop: 'Horticulture', image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=85', tags: ['Irrigation', 'Storage'] },
  { id: 3, name: 'Borrowdale Smallholding', area: 'Borrowdale, Harare', size: '0.75 hectares', price: '$75 / month', detail: '12 month lease', crop: 'Herbs & vegetables', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=85', tags: ['Shed', 'Power nearby'] },
  { id: 4, name: 'Norton River Flats', area: 'Norton, Mashonaland West', size: '4.1 hectares', price: '$260 / season', detail: 'Jun - Nov 2026', crop: 'Maize & beans', image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1000&q=85', tags: ['River access', 'Tilled'] },
]
const categories = ['All land', 'Vegetables', 'Grains', 'Orchards']

function App() {
  const [category, setCategory] = useState('All land')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<number[]>([2])
  const [filters, setFilters] = useState(false)
  const visible = useMemo(() => listings.filter((item) => {
    const text = `${item.name} ${item.area} ${item.crop}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const categoryMatch = category === 'All land' || item.crop.toLowerCase().includes(category.slice(0, -1).toLowerCase())
    return queryMatch && categoryMatch
  }), [category, query])
  const toggleSaved = (id: number) => setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top"><span className="brand-mark"><Sprout size={20} /></span><span>landlease</span></a>
      <nav className="desktop-nav"><a className="active" href="#discover">Discover land</a><a href="#how-it-works">How it works</a><a href="#resources">Farm resources</a></nav>
      <div className="topbar-actions"><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><span /></button><button className="profile-button"><span className="avatar">TM</span><span className="profile-name">Tendai M.</span><ChevronDown size={15} /></button><button className="menu-button" aria-label="Open menu"><Menu size={22} /></button></div>
    </header>
    <main id="top">
      <section className="hero" id="discover"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" /> THE GROUND IS WAITING</p><h1>Find your patch.<br /><em>Grow your future.</em></h1><p className="hero-description">Verified farmland for your next season, with the tools and support to make it thrive.</p><div className="trust-row"><span><ShieldCheck size={16} /> Verified landowners</span><span><Check size={16} /> Simple, secure leases</span></div></div><div className="hero-art"><div className="hero-image" /><div className="hero-stamp"><span>FIELD</span><strong>02</strong><span>FIND YOURS</span></div><div className="hero-caption"><span className="caption-line" /> <span>Est. 2026 / Zimbabwe</span></div></div></section>
      <section className="search-panel" aria-label="Search farmland"><div className="search-field"><MapPin size={19} /><div><label>Where do you want to farm?</label><button>Harare &amp; surrounds <ChevronDown size={14} /></button></div></div><div className="search-divider" /><div className="search-field"><Sprout size={19} /><div><label>What are you growing?</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Crop, land name or area" /></div></div><button className="search-button"><Search size={19} /><span>Search</span></button></section>
      <section className="content-section"><div className="section-heading"><div><p className="section-kicker">CURATED FOR YOU</p><h2>Land ready to grow on</h2></div><button className="outline-button" onClick={() => setFilters(!filters)}><Filter size={16} /> Filters <span className="filter-count">3</span></button></div><div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}<span className="result-count">{visible.length} of {listings.length} listings</span></div>{filters && <div className="filter-tray"><span><ShieldCheck size={16} /> Verified only</span><span><Sprout size={16} /> Soil report</span><span>Under $200 / month</span><button onClick={() => setFilters(false)} aria-label="Close filters"><X size={16} /></button></div>}<div className="listing-grid">{visible.map((listing) => <ListingCard key={listing.id} listing={listing} saved={saved.includes(listing.id)} onSave={toggleSaved} />)}</div>{visible.length === 0 && <div className="empty-state">No plots match that search yet. Try a broader crop or area.</div>}<button className="load-more">View all available land <span>→</span></button></section>
      <section className="planning-section" id="resources"><div className="planning-art"><div className="planning-circle">01</div><div className="field-lines" /></div><div className="planning-copy"><p className="section-kicker">FROM LEASE TO HARVEST</p><h2>More than land.<br /><em>A head start.</em></h2><p>Know what to plant, when to plant it, and where to find what you need. Your farm plan starts the moment you find your field.</p><button className="dark-button">Explore farm planning <span>↗</span></button><div className="planning-points"><span><Check size={15} /> Crop guidance</span><span><Check size={15} /> Seasonal plans</span><span><Check size={15} /> Local suppliers</span></div></div></section>
    </main>
    <footer><div className="footer-brand"><span className="brand-mark"><Sprout size={17} /></span><span>landlease</span></div><span>Good ground. Good growth.</span><div className="footer-links"><a href="#how-it-works">About</a><a href="#resources">Help centre</a><a href="#top">List your land</a></div></footer>
  </div>
}

function ListingCard({ listing, saved, onSave }: { listing: Listing; saved: boolean; onSave: (id: number) => void }) {
  return <article className="listing-card"><div className="listing-image-wrap"><img src={listing.image} alt={listing.name} /><div className="image-overlay"><span className="distance"><MapPin size={13} /> Harare area</span><button className={saved ? 'save-button saved' : 'save-button'} onClick={() => onSave(listing.id)} aria-label="Save listing"><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>{listing.featured && <span className="featured-badge">Featured plot</span>}</div><div className="listing-body"><div className="listing-title-row"><div><h3>{listing.name}</h3><p><MapPin size={13} /> {listing.area}</p></div><span className="verified"><ShieldCheck size={15} /></span></div><div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div><div className="listing-footer"><div><strong>{listing.price}</strong><small>{listing.detail}</small></div><div className="tags">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></article>
}
export default App
