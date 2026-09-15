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

  return <section className="container-xxl py-4 py-lg-5" style={{ maxWidth: 720 }}>
    <div className="d-flex align-items-center gap-3 mb-4">
      {step > 0 ? <button className="btn btn-link text-dark fw-semibold px-0 d-flex align-items-center gap-1 text-decoration-none" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button> : <span />}
      <div className="progress flex-grow-1" style={{ height: 4 }}><div className="progress-bar bg-dark" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <button className="btn btn-link text-secondary px-0 text-decoration-none" onClick={() => navigate('/host')}>Save &amp; exit</button>
    </div>
    <p className="text-primary fw-bold small text-uppercase mb-4" style={{ letterSpacing: '.08em' }}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

    {step === 0 && <div className="wizard-step">
      <h2>Tell us about your land</h2>
      <div className="mb-3"><label className="form-label fw-semibold">Land name</label><input className="form-control" value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="e.g. Mbare Greenbelt Plot" /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Area / region</label><input className="form-control" value={draft.area} onChange={(event) => update({ area: event.target.value })} placeholder="e.g. Harare South, Harare" /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Size</label><input className="form-control" value={draft.size} onChange={(event) => update({ size: event.target.value })} placeholder="e.g. 2.4 hectares" /></div>
    </div>}

    {step === 1 && <div className="wizard-step">
      <h2>What can grow there?</h2>
      <div className="mb-3"><label className="form-label fw-semibold">Primary crop</label><input className="form-control" value={draft.crop} onChange={(event) => update({ crop: event.target.value })} placeholder="e.g. Leafy greens" /></div>
      <label className="form-label fw-semibold">Features</label>
      <div className="tag-picker d-flex flex-wrap gap-2 mb-3">{TAG_OPTIONS.map((tag) => <button key={tag} type="button" className={draft.tags.includes(tag) ? 'btn btn-dark rounded-pill btn-sm d-flex align-items-center gap-1' : 'btn btn-outline-secondary rounded-pill btn-sm d-flex align-items-center gap-1'} onClick={() => toggleTag(tag)}>{draft.tags.includes(tag) && <Check size={12} />} {tag}</button>)}</div>
      <div className="mb-3"><label className="form-label fw-semibold">Description (optional)</label><textarea className="form-control" value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="What makes this land worth leasing?" rows={3} /></div>
    </div>}

    {step === 2 && <div className="wizard-step">
      <h2>Set your price</h2>
      <div className="mb-3"><label className="form-label fw-semibold">Price (USD)</label><input className="form-control" value={draft.price} onChange={(event) => update({ price: event.target.value.replace(/[^0-9.]/g, '') })} placeholder="e.g. 180" /></div>
      <div className="btn-group w-100 mb-3" role="group">
        <button type="button" className={draft.unit === 'season' ? 'btn btn-dark' : 'btn btn-outline-secondary'} onClick={() => update({ unit: 'season' })}>Per season</button>
        <button type="button" className={draft.unit === 'month' ? 'btn btn-dark' : 'btn btn-outline-secondary'} onClick={() => update({ unit: 'month' })}>Per month</button>
      </div>
      <div className="mb-3"><label className="form-label fw-semibold">Lease term</label><input className="form-control" value={draft.detail} onChange={(event) => update({ detail: event.target.value })} placeholder="e.g. Jun - Nov 2026, or Flexible term" /></div>
    </div>}

    {step === 3 && <div className="wizard-step">
      <h2>Add a photo</h2>
      <div className="mb-3"><label className="form-label fw-semibold">Image URL</label><input className="form-control" value={draft.image} onChange={(event) => update({ image: event.target.value })} placeholder="Paste a photo link, or leave blank for a placeholder" /></div>
      <div className="photo-preview">{draft.image ? <img src={draft.image} alt="Preview" /> : <div className="photo-placeholder"><ImagePlus size={22} /><span>No photo yet</span></div>}</div>
    </div>}

    {step === 4 && <div className="wizard-step">
      <h2>Review &amp; publish</h2>
      <div style={{ maxWidth: 280 }}><ListingCard listing={preview} saved={false} onSave={() => {}} /></div>
    </div>}

    <div className="d-flex justify-content-end border-top mt-4 pt-4">{step < STEPS.length - 1
      ? <button className="btn btn-primary rounded-pill px-4" disabled={!stepValid} onClick={() => setStep(step + 1)}>Continue →</button>
      : <button className="btn btn-primary rounded-pill px-4" onClick={onPublish}>{editingId ? 'Save changes' : 'Publish listing'} →</button>}</div>
  </section>
}
