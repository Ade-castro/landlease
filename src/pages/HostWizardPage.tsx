import { ArrowLeft, Check, ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ListingCard } from '../components/ListingCard'
import { useListings } from '../context/ListingsContext'
import { useToast } from '../context/ToastContext'
import { categories, emptyDraft, listingToDraft, PLACEHOLDER_IMAGE, STEPS, TAG_OPTIONS } from '../lib/data'
import type { Category, Draft } from '../lib/types'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'
import { BoundaryMap } from '../platform/BoundaryMap'

const CATEGORY_OPTIONS = categories.filter((item): item is Category => item !== 'All land')

export function HostWizardPage() {
  const { id } = useParams()
  const editingId = id ? Number(id) : null
  const { getListing, publish } = useListings()
  const { show } = useToast()
  const navigate = useNavigate()
  const { profile, user } = useFlow()
  const existing = editingId ? getListing(editingId) : undefined
  const [draft, setDraft] = useState<Draft>(() => existing ? listingToDraft(existing) : emptyDraft)
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }))
  const toggleTag = (tag: string) => update({ tags: draft.tags.includes(tag) ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag] })
  const stepValid = [
    draft.name.trim() !== '' && draft.area.trim() !== '' && draft.size.trim() !== '' && draft.boundary.trim() !== '',
    draft.crop.trim() !== '',
    draft.price.trim() !== '',
    draft.proofDeclared,
    true,
  ][step]
  const preview = { id: 0, name: draft.name || 'Your land name', area: draft.area || 'Area, region', size: draft.size || 'Size', price: draft.price ? `$${draft.price} / ${draft.unit}` : 'Set a price', detail: draft.detail || 'Lease term', crop: draft.crop || 'Crop', category: draft.category, image: draft.image || PLACEHOLDER_IMAGE, tags: draft.tags }

  const onPublish = async () => {
    setBusy(true); setError('')
    const listing = { id: editingId ?? 0, name: draft.name, area: draft.area, size: draft.size, crop: draft.crop, category: draft.category, tags: draft.tags, price: `$${draft.price} / ${draft.unit}`, detail: draft.detail, image: draft.image || PLACEHOLDER_IMAGE, description: draft.description, history: draft.history, soil: draft.soil, boundary: draft.boundary, proofDeclared: draft.proofDeclared, verificationStatus: 'pending' as const }
    try {
      await publish(listing, editingId)
      show(editingId ? 'Changes saved for review.' : 'Listing submitted. Admin verification is needed before it goes live.')
      navigate('/host')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save the listing.') }
    finally { setBusy(false) }
  }

  const onPhotoSelected = async (file?: File) => {
    if (!file) return
    if (!user) { setError('Sign in before uploading a photo.'); return }
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : ''
    if (!extension) { setError('Choose a JPG, PNG, or WebP photo.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be smaller than 5 MB.'); return }
    setPhotoBusy(true); setError('')
    try {
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('listing-photos').upload(path, file, { contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      update({ image: data.publicUrl })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Photo upload failed.') }
    finally { setPhotoBusy(false) }
  }

  if (!profile || profile.role !== 'landowner') return <section className="container-xxl py-5"><h1>Landowner onboarding</h1><p>Complete your landowner profile before creating a listing.</p><button className="btn btn-primary" onClick={() => navigate('/account?next=' + encodeURIComponent('/host/new'))}>Continue</button></section>

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
      <div className="mb-3"><label className="form-label fw-semibold">Land boundary / map reference</label><textarea className="form-control" value={draft.boundary} onChange={e => update({ boundary: e.target.value })} placeholder="GPS coordinates or description of plot boundaries" /><div className="form-text">Draw corners below to save a GeoJSON boundary, or enter an existing map reference.</div></div>
      <BoundaryMap value={draft.boundary} onChange={boundary => update({ boundary })} />
    </div>}

    {step === 1 && <div className="wizard-step">
      <h2>What can grow there?</h2>
      <div className="mb-3"><label className="form-label fw-semibold">Primary crop</label><input className="form-control" value={draft.crop} onChange={(event) => update({ crop: event.target.value })} placeholder="e.g. Leafy greens" /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Category</label><select className="form-select" value={draft.category} onChange={(event) => update({ category: event.target.value as Category })}>{CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select><div className="form-text">Decides which tab your listing shows up under on Discover land.</div></div>
      <label className="form-label fw-semibold">Features</label>
      <div className="tag-picker d-flex flex-wrap gap-2 mb-3">{TAG_OPTIONS.map((tag) => <button key={tag} type="button" className={draft.tags.includes(tag) ? 'btn btn-dark rounded-pill btn-sm d-flex align-items-center gap-1' : 'btn btn-outline-secondary rounded-pill btn-sm d-flex align-items-center gap-1'} onClick={() => toggleTag(tag)}>{draft.tags.includes(tag) && <Check size={12} />} {tag}</button>)}</div>
      <div className="mb-3"><label className="form-label fw-semibold">Description (optional)</label><textarea className="form-control" value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="What makes this land worth leasing?" rows={3} /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Land state and crop history</label><textarea className="form-control" value={draft.history} onChange={e => update({ history: e.target.value })} placeholder="Fallow, tilled, previous crops and years" /></div>
      <div className="mb-3"><label className="form-label fw-semibold">Soil testing status</label><input className="form-control" value={draft.soil} onChange={e => update({ soil: e.target.value })} placeholder="Not tested, or brief report summary" /></div>
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
      <div className="mb-3"><label className="form-label fw-semibold" htmlFor="land-photo">Upload a photo from your device</label><input id="land-photo" type="file" accept="image/jpeg,image/png,image/webp" className="form-control" disabled={photoBusy} onChange={event => void onPhotoSelected(event.target.files?.[0])} /><div className="form-text">JPG, PNG, or WebP, up to 5 MB. Photos are public after you share their link.</div></div>
      {photoBusy && <p role="status">Uploading photo…</p>}
      <div className="mb-3"><label className="form-label fw-semibold">Or paste a direct image URL</label><input className="form-control" value={draft.image} onChange={(event) => update({ image: event.target.value })} placeholder="https://example.com/photo.jpg" /><div className="form-text">A webpage link, such as an Unsplash photo page, will not display as an image.</div></div>
      <div className="photo-preview">{draft.image ? <img src={draft.image} alt="Preview" /> : <div className="photo-placeholder"><ImagePlus size={22} /><span>No photo yet</span></div>}</div>
      <label className="d-flex gap-2 mt-3"><input type="checkbox" checked={draft.proofDeclared} onChange={e => update({ proofDeclared: e.target.checked })} /> I have proof of ownership or the right to lease this land, and understand that admin review is required before publication.</label>
      <p className="small text-secondary mt-2">After submitting this plot, open My workspace → Verification to upload identity and land-right documents privately. Request a laboratory soil test in the Soil tests tab.</p>
    </div>}

    {step === 4 && <div className="wizard-step">
      <h2>Review &amp; submit for verification</h2>
      <div style={{ maxWidth: 280 }}><ListingCard listing={preview} saved={false} onSave={() => {}} /></div>
    </div>}

    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <div className="d-flex justify-content-end border-top mt-4 pt-4">{step < STEPS.length - 1
      ? <button className="btn btn-primary rounded-pill px-4" disabled={!stepValid} onClick={() => setStep(step + 1)}>Continue →</button>
      : <button className="btn btn-primary rounded-pill px-4" disabled={!draft.proofDeclared || busy || photoBusy} onClick={onPublish}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Submit listing'} →</button>}</div>
  </section>
}
