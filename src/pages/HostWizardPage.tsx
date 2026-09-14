import { ArrowLeft, Check, ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'
import { emptyDraft, listingToDraft, PLACEHOLDER_IMAGE, STEPS, TAG_OPTIONS } from '../lib/data'
import type { Draft } from '../lib/types'

export function HostWizardPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const { getListing, publish } = useListings()
  const { show } = useToast()
  const navigate = useNavigate()
  const existing = editingId ? getListing(editingId) : undefined
  const [draft, setDraft] = useState<Draft>(() => existing ? listingToDraft(existing) : emptyDraft)
  const [step, setStep] = useState(0)

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))
  const toggleTag = (tag: string) => update({ tags: draft.tags.includes(tag) ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag] })
  const stepValid = [
    draft.name.trim() !== '' && draft.area.trim() !== '' && draft.size.trim() !== '',
    draft.crop.trim() !== '',
    draft.price.trim() !== '',
    true,
    true,
  ][step]
  const preview = { id: 0, name: draft.name || 'Your land name', area: draft.area || 'Area, region', size: draft.size || 'Size', price: draft.price ? `$${draft.price} / ${draft.unit}` : 'Set a price', detail: draft.detail || 'Lease term', crop: draft.crop || 'Crop', image: draft.image || PLACEHOLDER_IMAGE, tags: draft.tags }

  const onPublish = () => {
    const listing = { id: editingId ?? Date.now(), name: draft.name, area: draft.area, size: draft.size, crop: draft.crop, tags: draft.tags, price: `$${draft.price} / ${draft.unit}`, detail: draft.detail, image: draft.image || PLACEHOLDER_IMAGE, description: draft.description, ownerId: 'me' as const }
    publish(listing, editingId)
    show(editingId ? 'Changes saved.' : 'Listing published — it’s now live in Discover land.')
    navigate('/host')
  }

  return <section className="content-section host-wizard">
    <div className="wizard-topbar">
      {step > 0 ? <button className="link-reset wizard-back" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button> : <span />}
      <div className="wizard-progress"><div className="wizard-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <button className="link-reset wizard-exit" onClick={() => navigate('/host')}>Save &amp; exit</button>
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
      <label className="field-label">Description (optional)<textarea value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="What makes this land worth leasing?" rows={3} /></label>
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
      : <button className="dark-button" onClick={onPublish}>{editingId ? 'Save changes' : 'Publish listing'} <span>→</span></button>}</div>
  </section>
}
