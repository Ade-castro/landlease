import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Bell, Bookmark, Check, ChevronDown, Filter, ImagePlus, MapPin, Menu, Pencil, Plus, Search, ShieldCheck, Sprout, Trash2, X } from 'lucide-react'

type Listing = { id: number; name: string; area: string; size: string; price: string; detail: string; crop: string; image: string; tags: string[]; featured?: boolean; ownerId?: 'me' }
type Draft = { name: string; area: string; size: string; crop: string; tags: string[]; price: string; unit: 'season' | 'month'; detail: string; image: string }
type SetDraft = (updater: Draft | ((prev: Draft) => Draft)) => void

const seedListings: Listing[] = [
  { id: 1, name: 'Mbare Greenbelt Plot', area: 'Harare South, Harare', size: '2.4 hectares', price: '$180 / season', detail: 'Jun - Nov 2026', crop: 'Leafy greens', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=85', tags: ['Borehole', 'Fenced'], featured: true },
  { id: 2, name: 'Chitungwiza Orchard Land', area: 'Manyame, Mashonaland East', size: '1.8 hectares', price: '$95 / month', detail: 'Flexible term', crop: 'Horticulture', image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=85', tags: ['Irrigation', 'Storage'] },
  { id: 3, name: 'Borrowdale Smallholding', area: 'Borrowdale, Harare', size: '0.75 hectares', price: '$75 / month', detail: '12 month lease', crop: 'Herbs & vegetables', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=85', tags: ['Shed', 'Power nearby'] },
  { id: 4, name: 'Norton River Flats', area: 'Norton, Mashonaland West', size: '4.1 hectares', price: '$260 / season', detail: 'Jun - Nov 2026', crop: 'Maize & beans', image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&w=1000&q=85', tags: ['River access', 'Tilled'] },
]
const categories = ['All land', 'Vegetables', 'Grains', 'Orchards']
const TAG_OPTIONS = ['Borehole', 'Fenced', 'Irrigation', 'Storage', 'Shed', 'Power nearby', 'River access', 'Tilled']
const STEPS = ['Basics', 'Crop & features', 'Price & term', 'Photo', 'Review']
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85'
const MY_LISTINGS_KEY = 'landlease-my-listings'
const emptyDraft: Draft = { name: '', area: '', size: '', crop: '', tags: [], price: '', unit: 'season', detail: '', image: '' }

function loadMyListings(): Listing[] {
  try { return JSON.parse(localStorage.getItem(MY_LISTINGS_KEY) ?? '[]') } catch { return [] }
}
function listingToDraft(listing: Listing): Draft {
  const [price, unit] = listing.price.replace('$', '').split(' / ')
  return { name: listing.name, area: listing.area, size: listing.size, crop: listing.crop, tags: listing.tags, price, unit: unit === 'month' ? 'month' : 'season', detail: listing.detail, image: listing.image }
}

/** Fades an element in once it scrolls into view; a no-op if the visitor prefers reduced motion. */
function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return { ref, className: visible ? 'reveal in-view' : 'reveal', style: { transitionDelay: `${delay}ms` } }
}

function App() {
  const [mode, setMode] = useState<'guest' | 'host'>('guest')
  const [hostView, setHostView] = useState<'dashboard' | 'wizard'>('dashboard')
  const [category, setCategory] = useState('All land')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState<number[]>([2])
  const [filters, setFilters] = useState(false)
  const [listings, setListings] = useState<Listing[]>(() => [...seedListings, ...loadMyListings()])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    try { localStorage.setItem(MY_LISTINGS_KEY, JSON.stringify(listings.filter((item) => item.ownerId === 'me'))) } catch { /* storage unavailable */ }
  }, [listings])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const showToast = (message: string) => {
    clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const visible = useMemo(() => listings.filter((item) => {
    const text = `${item.name} ${item.area} ${item.crop}`.toLowerCase()
    const queryMatch = text.includes(query.toLowerCase())
    const categoryMatch = category === 'All land' || item.crop.toLowerCase().includes(category.slice(0, -1).toLowerCase())
    return queryMatch && categoryMatch
  }), [category, query, listings])
  const myListings = useMemo(() => listings.filter((item) => item.ownerId === 'me'), [listings])
  const toggleSaved = (id: number) => setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])

  const goToGuest = () => { setMode('guest'); setMenuOpen(false) }
  const startNewListing = () => { setDraft(emptyDraft); setEditingId(null); setStep(0); setMode('host'); setHostView('wizard'); setMenuOpen(false) }
  const startEditListing = (listing: Listing) => { setDraft(listingToDraft(listing)); setEditingId(listing.id); setStep(0); setHostView('wizard') }
  const removeListing = (id: number) => { setListings((items) => items.filter((item) => item.id !== id)); showToast('Listing removed.') }
  const publishListing = () => {
    const listing: Listing = { id: editingId ?? Date.now(), name: draft.name, area: draft.area, size: draft.size, crop: draft.crop, tags: draft.tags, price: `$${draft.price} / ${draft.unit}`, detail: draft.detail, image: draft.image || PLACEHOLDER_IMAGE, ownerId: 'me' }
    setListings((items) => editingId ? items.map((item) => item.id === editingId ? listing : item) : [listing, ...items])
    setHostView('dashboard')
    showToast(editingId ? 'Changes saved.' : 'Listing published — it’s now live in Discover land.')
  }
  const stepValid = [
    draft.name.trim() !== '' && draft.area.trim() !== '' && draft.size.trim() !== '',
    draft.crop.trim() !== '',
    draft.price.trim() !== '',
    true,
    true,
  ][step]
  const heroCopyReveal = useReveal<HTMLDivElement>()
  const heroArtReveal = useReveal<HTMLDivElement>(120)
  const searchReveal = useReveal<HTMLElement>(160)
  const planningArtReveal = useReveal<HTMLDivElement>()
  const planningCopyReveal = useReveal<HTMLDivElement>(120)

  return <div className="app-shell">
    <header className={scrolled ? 'topbar scrolled' : 'topbar'}>
      <button className="brand link-reset" onClick={goToGuest}><span className="brand-mark"><Sprout size={20} /></span><span>landlease</span></button>
      <nav className="desktop-nav">{mode === 'guest'
        ? <><a className="active" href="#discover">Discover land</a><a href="#how-it-works">How it works</a><a href="#resources">Farm resources</a></>
        : <a className="active" href="#top">Your listings</a>}</nav>
      <div className="topbar-actions">
        <button className="link-reset host-toggle" onClick={() => setMode(mode === 'guest' ? 'host' : 'guest')}>{mode === 'guest' ? 'List your land' : 'Switch to renting'}</button>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><span /></button>
        <button className="profile-button"><span className="avatar">TM</span><span className="profile-name">Tendai M.</span><ChevronDown size={15} /></button>
        <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {menuOpen && <nav className="mobile-menu">{mode === 'guest'
        ? <><a href="#discover" onClick={() => setMenuOpen(false)}>Discover land</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#resources" onClick={() => setMenuOpen(false)}>Farm resources</a></>
        : <a href="#top" onClick={() => setMenuOpen(false)}>Your listings</a>}<button className="link-reset host-toggle" onClick={() => { setMode(mode === 'guest' ? 'host' : 'guest'); setMenuOpen(false) }}>{mode === 'guest' ? 'List your land' : 'Switch to renting'}</button></nav>}
    </header>
    <main id="top">
      <div key={mode === 'guest' ? 'guest' : `host-${hostView}-${step}`} className="view-transition">
        {mode === 'guest' ? <>
          <section className="hero" id="discover"><div ref={heroCopyReveal.ref} className={`hero-copy ${heroCopyReveal.className}`} style={heroCopyReveal.style}><p className="eyebrow"><span className="eyebrow-dot" /> THE GROUND IS WAITING</p><h1>Find your patch.<br /><em>Grow your future.</em></h1><p className="hero-description">Verified farmland for your next season, with the tools and support to make it thrive.</p><div className="trust-row"><span><ShieldCheck size={16} /> Verified landowners</span><span><Check size={16} /> Simple, secure leases</span></div></div><div ref={heroArtReveal.ref} className={`hero-art ${heroArtReveal.className}`} style={heroArtReveal.style}><div className="hero-image" /><div className="hero-stamp"><span>FIELD</span><strong>02</strong><span>FIND YOURS</span></div><div className="hero-caption"><span className="caption-line" /> <span>Est. 2026 / Zimbabwe</span></div></div></section>
          <section ref={searchReveal.ref} className={`search-panel ${searchReveal.className}`} style={searchReveal.style} aria-label="Search farmland"><div className="search-field"><MapPin size={19} /><div><label>Where do you want to farm?</label><button>Harare &amp; surrounds <ChevronDown size={14} /></button></div></div><div className="search-divider" /><div className="search-field"><Sprout size={19} /><div><label>What are you growing?</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Crop, land name or area" /></div></div><button className="search-button"><Search size={19} /><span>Search</span></button></section>
          <section className="content-section"><div className="section-heading"><div><p className="section-kicker">CURATED FOR YOU</p><h2>Land ready to grow on</h2></div><button className="outline-button" onClick={() => setFilters(!filters)}><Filter size={16} /> Filters <span className="filter-count">3</span></button></div><div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}<span className="result-count">{visible.length} of {listings.length} listings</span></div>{filters && <div className="filter-tray"><span><ShieldCheck size={16} /> Verified only</span><span><Sprout size={16} /> Soil report</span><span>Under $200 / month</span><button onClick={() => setFilters(false)} aria-label="Close filters"><X size={16} /></button></div>}<div className="listing-grid">{visible.map((listing, index) => <ListingCard key={listing.id} listing={listing} saved={saved.includes(listing.id)} onSave={toggleSaved} delay={index * 60} />)}</div>{visible.length === 0 && <div className="empty-state">No plots match that search yet. Try a broader crop or area.</div>}<button className="load-more">View all available land <span>→</span></button></section>
          <section className="planning-section" id="resources"><div ref={planningArtReveal.ref} className={`planning-art ${planningArtReveal.className}`} style={planningArtReveal.style}><div className="planning-circle">01</div><div className="field-lines" /></div><div ref={planningCopyReveal.ref} className={`planning-copy ${planningCopyReveal.className}`} style={planningCopyReveal.style}><p className="section-kicker">FROM LEASE TO HARVEST</p><h2>More than land.<br /><em>A head start.</em></h2><p>Know what to plant, when to plant it, and where to find what you need. Your farm plan starts the moment you find your field.</p><button className="dark-button">Explore farm planning <span>↗</span></button><div className="planning-points"><span><Check size={15} /> Crop guidance</span><span><Check size={15} /> Seasonal plans</span><span><Check size={15} /> Local suppliers</span></div></div></section>
        </> : hostView === 'dashboard'
          ? <HostDashboard listings={myListings} onCreate={startNewListing} onEdit={startEditListing} onRemove={removeListing} />
          : <HostWizard draft={draft} setDraft={setDraft} step={step} setStep={setStep} stepValid={stepValid} isEditing={editingId !== null} onCancel={() => setHostView('dashboard')} onPublish={publishListing} />}
      </div>
    </main>
    <footer><div className="footer-brand"><span className="brand-mark"><Sprout size={17} /></span><span>landlease</span></div><span>Good ground. Good growth.</span><div className="footer-links"><a href="#how-it-works">About</a><a href="#resources">Help centre</a><button className="link-reset" onClick={startNewListing}>List your land</button></div></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

function HostDashboard({ listings, onCreate, onEdit, onRemove }: { listings: Listing[]; onCreate: () => void; onEdit: (listing: Listing) => void; onRemove: (id: number) => void }) {
  const heroCopyReveal = useReveal<HTMLDivElement>()
  const heroArtReveal = useReveal<HTMLDivElement>(120)
  return <>
    <section className="hero host-hero"><div ref={heroCopyReveal.ref} className={`hero-copy ${heroCopyReveal.className}`} style={heroCopyReveal.style}><p className="eyebrow"><span className="eyebrow-dot" /> HOSTING ON LANDLEASE</p><h1>List your land.<br /><em>Earn every season.</em></h1><p className="hero-description">Reach verified farmers searching for land right now. You set the price, the term and who leases it.</p><div className="trust-row"><span><ShieldCheck size={16} /> You control the terms</span><span><Check size={16} /> Free to list</span></div><button className="dark-button host-cta" onClick={onCreate}><Plus size={15} /> List new land</button></div><div ref={heroArtReveal.ref} className={`hero-art ${heroArtReveal.className}`} style={heroArtReveal.style}><div className="hero-image" /></div></section>
    <section className="content-section">
      <div className="section-heading"><div><p className="section-kicker">YOUR LAND</p><h2>Manage your listings</h2></div>{listings.length > 0 && <button className="outline-button" onClick={onCreate}><Plus size={16} /> List new land</button>}</div>
      {listings.length === 0
        ? <div className="host-empty"><Sprout size={26} /><p>You haven't listed any land yet.</p><button className="dark-button" onClick={onCreate}>List your first plot <span>→</span></button></div>
        : <div className="listing-grid">{listings.map((listing, index) => <HostListingCard key={listing.id} listing={listing} onEdit={() => onEdit(listing)} onRemove={() => onRemove(listing.id)} delay={index * 60} />)}</div>}
    </section>
  </>
}

function HostListingCard({ listing, onEdit, onRemove, delay = 0 }: { listing: Listing; onEdit: () => void; onRemove: () => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card host-listing-card ${reveal.className}`} style={reveal.style}><div className="listing-image-wrap"><img src={listing.image} alt={listing.name} /><span className="live-badge">Live</span></div><div className="listing-body"><div className="listing-title-row"><div><h3>{listing.name}</h3><p><MapPin size={13} /> {listing.area}</p></div></div><div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div><div className="listing-footer"><div><strong>{listing.price}</strong><small>{listing.detail}</small></div><div className="host-card-actions"><button className="icon-button" onClick={onEdit} aria-label="Edit listing"><Pencil size={15} /></button><button className="icon-button" onClick={onRemove} aria-label="Remove listing"><Trash2 size={15} /></button></div></div></div></article>
}

function HostWizard({ draft, setDraft, step, setStep, stepValid, isEditing, onCancel, onPublish }: { draft: Draft; setDraft: SetDraft; step: number; setStep: (step: number) => void; stepValid: boolean; isEditing: boolean; onCancel: () => void; onPublish: () => void }) {
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))
  const toggleTag = (tag: string) => update({ tags: draft.tags.includes(tag) ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag] })
  const preview: Listing = { id: 0, name: draft.name || 'Your land name', area: draft.area || 'Area, region', size: draft.size || 'Size', price: draft.price ? `$${draft.price} / ${draft.unit}` : 'Set a price', detail: draft.detail || 'Lease term', crop: draft.crop || 'Crop', image: draft.image || PLACEHOLDER_IMAGE, tags: draft.tags }

  return <section className="content-section host-wizard">
    <div className="wizard-topbar">
      {step > 0 ? <button className="link-reset wizard-back" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button> : <span />}
      <div className="wizard-progress"><div className="wizard-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <button className="link-reset wizard-exit" onClick={onCancel}>Save &amp; exit</button>
    </div>
    <p className="section-kicker">STEP {step + 1} OF {STEPS.length} · {STEPS[step].toUpperCase()}</p>

    {step === 0 && <div className="wizard-step">
      <h2>Tell us about your land</h2>
      <label className="field-label">Land name<input value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="e.g. Mbare Greenbelt Plot" /></label>
      <label className="field-label">Area / region<input value={draft.area} onChange={(event) => update({ area: event.target.value })} placeholder="e.g. Harare South, Harare" /></label>
      <label className="field-label">Size<input value={draft.size} onChange={(event) => update({ size: event.target.value })} placeholder="e.g. 2.4 hectares" /></label>
    </div>}

    {step === 1 && <div className="wizard-step">
      <h2>What can grow there?</h2>
      <label className="field-label">Primary crop<input value={draft.crop} onChange={(event) => update({ crop: event.target.value })} placeholder="e.g. Leafy greens" /></label>
      <p className="field-label">Features</p>
      <div className="tag-picker">{TAG_OPTIONS.map((tag) => <button key={tag} type="button" className={draft.tags.includes(tag) ? 'tag-option active' : 'tag-option'} onClick={() => toggleTag(tag)}>{draft.tags.includes(tag) && <Check size={12} />} {tag}</button>)}</div>
    </div>}

    {step === 2 && <div className="wizard-step">
      <h2>Set your price</h2>
      <label className="field-label">Price (USD)<input value={draft.price} onChange={(event) => update({ price: event.target.value.replace(/[^0-9.]/g, '') })} placeholder="e.g. 180" /></label>
      <div className="unit-toggle"><button type="button" className={draft.unit === 'season' ? 'active' : ''} onClick={() => update({ unit: 'season' })}>Per season</button><button type="button" className={draft.unit === 'month' ? 'active' : ''} onClick={() => update({ unit: 'month' })}>Per month</button></div>
      <label className="field-label">Lease term<input value={draft.detail} onChange={(event) => update({ detail: event.target.value })} placeholder="e.g. Jun - Nov 2026, or Flexible term" /></label>
    </div>}

    {step === 3 && <div className="wizard-step">
      <h2>Add a photo</h2>
      <label className="field-label">Image URL<input value={draft.image} onChange={(event) => update({ image: event.target.value })} placeholder="Paste a photo link, or leave blank for a placeholder" /></label>
      <div className="photo-preview">{draft.image ? <img src={draft.image} alt="Preview" /> : <div className="photo-placeholder"><ImagePlus size={22} /><span>No photo yet</span></div>}</div>
    </div>}

    {step === 4 && <div className="wizard-step">
      <h2>Review &amp; publish</h2>
      <div className="listing-grid review-grid"><ListingCard listing={preview} saved={false} onSave={() => {}} /></div>
    </div>}

    <div className="wizard-actions">{step < STEPS.length - 1
      ? <button className="dark-button" disabled={!stepValid} onClick={() => setStep(step + 1)}>Continue <span>→</span></button>
      : <button className="dark-button" onClick={onPublish}>{isEditing ? 'Save changes' : 'Publish listing'} <span>→</span></button>}</div>
  </section>
}

function ListingCard({ listing, saved, onSave, delay = 0 }: { listing: Listing; saved: boolean; onSave: (id: number) => void; delay?: number }) {
  const reveal = useReveal<HTMLElement>(delay)
  return <article ref={reveal.ref} className={`listing-card ${reveal.className}`} style={reveal.style}><div className="listing-image-wrap"><img src={listing.image} alt={listing.name} /><div className="image-overlay"><span className="distance"><MapPin size={13} /> Harare area</span><button className={saved ? 'save-button saved' : 'save-button'} onClick={() => onSave(listing.id)} aria-label="Save listing"><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>{listing.featured && <span className="featured-badge">Featured plot</span>}</div><div className="listing-body"><div className="listing-title-row"><div><h3>{listing.name}</h3><p><MapPin size={13} /> {listing.area}</p></div><span className="verified"><ShieldCheck size={15} /></span></div><div className="listing-meta"><span>{listing.size}</span><span className="meta-dot" /><span>{listing.crop}</span></div><div className="listing-footer"><div><strong>{listing.price}</strong><small>{listing.detail}</small></div><div className="tags">{listing.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></article>
}
export default App
