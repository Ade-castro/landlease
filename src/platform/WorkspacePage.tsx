import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { useListings } from '../context/ListingsContext'
import { supabase } from '../lib/supabase'
import { cropGuides, budgetSummary } from './advisory'
import { errorText, type Contract, type PlatformRequest } from './models'

const tabs = [['overview','Overview'],['verification','Verification'],['soil','Soil tests'],['contracts','Agreements'],['planning','Season planning'],['services','Equipment and inputs'],['disputes','Disputes'],['reviews','Ratings'],['notifications','Notifications'],['admin','Admin operations']]
type Notice = { id: string; message: string; link: string; read_at: string | null; created_at: string }

export function WorkspacePage() {
  const { user, profile, loading: authLoading } = useFlow()
  const { myListings, listings } = useListings()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'overview'
  const [requests, setRequests] = useState<PlatformRequest[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listingId, setListingId] = useState('')
  const [contractId, setContractId] = useState('')
  const [docKind, setDocKind] = useState('identity')
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [text, setText] = useState('')
  const [contact, setContact] = useState('')
  const [title, setTitle] = useState('')
  const [serviceType, setServiceType] = useState('Inputs')
  const [price, setPrice] = useState('')
  const [rating, setRating] = useState('5')
  const [crop, setCrop] = useState<keyof typeof cropGuides>('Leafy vegetables')
  const [plantDate, setPlantDate] = useState('')
  const [budgets, setBudgets] = useState([0,0,0,0,0])
  const [adminNote, setAdminNote] = useState('')
  const [laboratory, setLaboratory] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [reportText, setReportText] = useState('')
  const [ph, setPh] = useState('')
  const [docLink, setDocLink] = useState<{ id: string; url: string } | null>(null)
  const [evidenceChecked, setEvidenceChecked] = useState(false)
  const [audit, setAudit] = useState<{ id: number; event: string; entity_id: string; created_at: string }[]>([])

  const reload = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const results = await Promise.all([supabase.from('platform_requests').select('*').order('created_at', { ascending: false }),supabase.from('landlease_contracts').select('*').order('created_at', { ascending: false }),supabase.from('landlease_notifications').select('*').order('created_at', { ascending: false }).limit(100),supabase.rpc('is_landlease_admin')])
    const firstError = results.find(result => result.error)?.error
    if (firstError) setError('Platform setup or connection error: ' + firstError.message)
    else {
      setRequests(results[0].data as PlatformRequest[] || []);setContracts(results[1].data as Contract[] || []);setNotices(results[2].data as Notice[] || []);setIsAdmin(Boolean(results[3].data));setError('')
      if (results[3].data) {
        const a = await supabase.from('landlease_audit_log').select('id,event,entity_id,created_at').order('created_at', { ascending: false }).limit(30)
        if (!a.error) setAudit(a.data || [])
      }
    }
    setLoading(false)
  }, [user?.id])
  useEffect(() => { void reload(); const timer = window.setInterval(() => { void reload() }, 30000);return () => window.clearInterval(timer) }, [reload])
  useEffect(() => { setText('');setConsent(false);setMessage('');setDocLink(null);setEvidenceChecked(false) }, [tab])
  async function submit(kind: string, payload: Record<string, unknown>, id: number | null = null) {
    setBusy(true);setError('');setMessage('')
    try {
      const { error: e } = await supabase.rpc('submit_platform_request', { p_kind: kind, p_listing_id: id, p_payload: payload })
      if (e) throw e
      setMessage('Saved successfully.');await reload()
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }
  async function upload(e: FormEvent) {
    e.preventDefault();if (!file || !user) return
    setBusy(true);setError('');setMessage('')
    let path = ''
    try {
      if (!consent) throw new Error('Consent is required.')
      const extension = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : ''
      if (!extension || file.size > 5 * 1024 * 1024) throw new Error('Choose a PDF, JPG or PNG smaller than 5 MB.')
      path = `${user.id}/${crypto.randomUUID()}.${extension}`
      const uploadResult = await supabase.storage.from('verification-documents').upload(path, file, { contentType: file.type })
      if (uploadResult.error) throw uploadResult.error
      const result = await supabase.rpc('submit_platform_request', { p_kind: docKind, p_listing_id: docKind === 'land_proof' ? Number(listingId) : null, p_payload: { path, consent: true, consent_at: new Date().toISOString() } })
      if (result.error) { await supabase.storage.from('verification-documents').remove([path]);throw result.error }
      setFile(null);setMessage('Private document submitted for review.');await reload()
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }
  async function openDocument(r: PlatformRequest) {
    const { data, error: e } = await supabase.storage.from('verification-documents').createSignedUrl(String(r.payload.path), 60)
    if (e) setError(e.message)
    else { setDocLink({ id: r.id, url: data.signedUrl });setEvidenceChecked(false) }
  }
  async function review(r: PlatformRequest, decision: string) {
    setBusy(true);setError('');setMessage('')
    try {
      if (adminNote.trim().length < 3) throw new Error('Enter a decision note first.')
      if (['identity','land_proof'].includes(r.kind)) {
        if (!evidenceChecked) throw new Error('Confirm you examined the evidence before completing review.')
        if (r.payload.path) {
          const removed = await supabase.storage.from('verification-documents').remove([String(r.payload.path)])
          if (removed.error) throw removed.error
        }
      }
      const result = await supabase.rpc('review_platform_request', { p_id: r.id, p_decision: decision, p_note: adminNote, p_report: { laboratory, report_date: reportDate, summary: reportText, ph } })
      if (result.error) throw result.error
      setDocLink(null);setEvidenceChecked(false);setMessage('Review recorded.');await reload()
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }
  if (authLoading) return <section className="container py-5">Loading account…</section>
  if (!user) return <section className="container py-5"><h1>Landlease workspace</h1><p><Link to="/account">Sign in</Link> to manage verification, agreements and farming services.</p><Link className="btn btn-primary" to="/demo">Open presentation demo</Link></section>
  const mine = requests.filter(r => r.user_id === user.id)
  const ownContracts = contracts.filter(c => c.owner_id === user.id || c.tenant_id === user.id)
  const active = ownContracts.filter(c => c.status === 'active')
  const selectableContracts = tab === 'disputes' ? ownContracts : active
  const contractSelect = <label>Lease agreement<select required className="form-select" value={contractId} onChange={e => setContractId(e.target.value)}><option value="">Choose your agreement</option>{selectableContracts.map(c => <option key={c.id} value={c.id}>Plot #{c.listing_id} · {c.status.replaceAll('_',' ')}</option>)}</select></label>
  const listingSelect = <label>Your plot<select required className="form-select" value={listingId} onChange={e => setListingId(e.target.value)}><option value="">Choose your plot</option>{myListings.map(l => <option key={l.id} value={l.id}>{l.name} · #{l.id}</option>)}</select></label>
  const statusRows = (kinds: string[]) => mine.filter(r => kinds.includes(r.kind)).map(r => <div key={r.id} className="border rounded p-3 mt-2"><strong>{r.kind.replaceAll('_',' ')}</strong> · {r.status}<br /><small>{new Date(r.created_at).toLocaleString()}</small>{r.admin_note && <p className="mb-0">Review note: {r.admin_note}</p>}</div>)
  return <section className="container-xxl py-5" style={{ maxWidth: 1050 }}>
    <h1>Landlease workspace</h1><p className="text-secondary">{profile?.name} · {profile?.role}</p>
    <div className="d-flex gap-2 flex-wrap mb-4">{tabs.filter(t => t[0] !== 'admin' || isAdmin).map(([key,label]) => <button key={key} className={tab === key ? 'btn btn-dark btn-sm' : 'btn btn-outline-dark btn-sm'} onClick={() => setParams({ tab: key })}>{label}</button>)}</div>
    {loading && <p>Loading workspace…</p>}
    {error && <p role="alert" className="alert alert-danger">{error}</p>}{message && <p role="status" className="alert alert-success">{message}</p>}
    {tab === 'overview' && <><div className="row g-3 mb-4">{[['Your listings',myListings.length],['Your agreements',ownContracts.length],['Active leases',active.length],['Unread notices',notices.filter(n => !n.read_at).length]].map(([label,count]) => <div className="col-6 col-md-3" key={label}><div className="card p-3"><strong className="fs-3">{count}</strong>{label}</div></div>)}</div><p>Start with identity verification. Landowners submit land-right documents and request a soil test for each plot. After approval, tenants can request a visit and negotiate terms.</p><p>Payment requires both account acceptances and a connected licensed gateway. Soil collection and charges must be agreed with a real laboratory.</p><Link to="/demo" className="btn btn-outline-primary">Run the complete presentation demo</Link></>}
    {tab === 'verification' && <><h2 className="h4">Private identity and land-right documents</h2><form onSubmit={e => void upload(e)} className="card p-4 d-flex flex-column gap-3"><label>Document type<select className="form-select" value={docKind} onChange={e => setDocKind(e.target.value)}><option value="identity">National ID or identity document</option>{profile?.role === 'landowner' && <option value="land_proof">Title deed or authority to lease</option>}</select></label>{docKind === 'land_proof' && listingSelect}<label>Document<input required className="form-control" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} /></label><label className="d-flex gap-2"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} />I consent to private review of this document. The upload is deleted when the reviewer completes the decision; a timestamp and decision remain.</label><p className="small text-secondary">Only you and authorized administrators can access the upload. Do not use demo identity documents as real verification evidence.</p><button disabled={busy || !consent || !file} className="btn btn-primary align-self-start">Submit privately</button></form>{statusRows(['identity','land_proof'])}</>}
    {tab === 'soil' && <><h2 className="h4">Request sample collection</h2><p>A laboratory partnership and pricing must be confirmed before a paid test can be booked. Submitting this request does not charge you or confirm a laboratory appointment.</p><form onSubmit={e => { e.preventDefault();void submit('soil_test', { collection: text, contact }, Number(listingId)) }} className="card p-4 d-flex flex-column gap-3">{listingSelect}<label>Collection instructions<textarea required minLength={5} className="form-control" value={text} onChange={e => setText(e.target.value)} /></label><label>Contact telephone<input required className="form-control" type="tel" value={contact} onChange={e => setContact(e.target.value)} /></label><button disabled={busy} className="btn btn-primary align-self-start">Request soil-test arrangement</button></form>{statusRows(['soil_test'])}</>}
    {tab === 'contracts' && <><h2 className="h4">Your agreements</h2>{ownContracts.length === 0 && <p>No agreements yet. A confirmed farm visit, accepted terms and both witnesses are needed first. <Link to="/my-visits">My farm visits</Link></p>}{ownContracts.map(c => <div key={c.id} className="card p-3 mb-2"><strong>{listings.find(l => l.id === c.listing_id)?.name || `Plot #${c.listing_id}`}</strong><p>{c.status.replaceAll('_',' ')} · USD {Number(c.amount).toFixed(2)}</p><Link to={'/contract/' + c.id}>Review agreement</Link></div>)}</>}
    {tab === 'planning' && <><h2 className="h4">Guided season plan</h2><p>General planning guidance; fertilizer and crop choices require your actual laboratory report and local extension advice.</p><form onSubmit={e => { e.preventDefault();void submit('plan', { contract_id: contractId, crop, planting_date: plantDate, budget_usd: budgetSummary(...budgets as [number,number,number,number,number]), tasks: cropGuides[crop].tasks.join('\n') }) }} className="card p-4 d-flex flex-column gap-3">{contractSelect}<label>Crop<select className="form-select" value={crop} onChange={e => setCrop(e.target.value as keyof typeof cropGuides)}>{Object.keys(cropGuides).map(c => <option key={c}>{c}</option>)}</select></label><p>{cropGuides[crop].season}</p><ol>{cropGuides[crop].tasks.map(t => <li key={t}>{t}</li>)}</ol><p><strong>Inputs:</strong> {cropGuides[crop].inputs}</p><label>Planned planting date<input required type="date" className="form-control" value={plantDate} onChange={e => setPlantDate(e.target.value)} /></label><div className="row g-2">{['Seed','Fertilizer','Water','Labour','Other'].map((label,index) => <label className="col-sm-4" key={label}>{label} USD<input type="number" min={0} max={1000000} className="form-control" value={budgets[index]} onChange={e => setBudgets(values => values.map((v,i) => i === index ? Number(e.target.value) : v))} /></label>)}</div><strong>Estimated inputs budget: USD {budgetSummary(...budgets as [number,number,number,number,number]).toFixed(2)}</strong><button disabled={busy || !contractId} className="btn btn-primary align-self-start">Save plan for active lease</button></form>{statusRows(['plan'])}</>}
    {tab === 'services' && <><h2 className="h4">Equipment, labour and input directory</h2><p>Contact providers directly. Online service bookings and add-on payment commissions are not connected yet.</p><div className="row g-3 mb-4">{requests.filter(r => r.kind === 'service' && r.status === 'approved').map(r => <div className="col-md-6" key={r.id}><div className="card p-3"><h3 className="h5">{String(r.payload.title)}</h3><p>{String(r.payload.category)} · {String(r.payload.area || '')}</p><p>{String(r.payload.description || '')}</p><p>{String(r.payload.price || '')}</p><a href={'tel:' + String(r.payload.contact).replace(/[^+0-9]/g,'')}>{String(r.payload.contact)}</a></div></div>)}</div><h3 className="h5">Submit your service or input business</h3><form onSubmit={e => { e.preventDefault();void submit('service', { title, category: serviceType, description: text, contact, price, public_contact_consent: consent }) }} className="card p-4 d-flex flex-column gap-3"><label>Business or service name<input required minLength={3} className="form-control" value={title} onChange={e => setTitle(e.target.value)} /></label><label>Type<select className="form-select" value={serviceType} onChange={e => setServiceType(e.target.value)}>{['Inputs','Equipment','Labour','Farm management'].map(s => <option key={s}>{s}</option>)}</select></label><label>Service and location<textarea required className="form-control" value={text} onChange={e => setText(e.target.value)} /></label><label>Public telephone<input required className="form-control" value={contact} onChange={e => setContact(e.target.value)} /></label><label>Price or quote policy<input required className="form-control" value={price} onChange={e => setPrice(e.target.value)} /></label><label className="d-flex gap-2"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I consent to publishing these business contact details in the directory.</label><button disabled={busy || !consent} className="btn btn-primary align-self-start">Submit for review</button></form>{statusRows(['service'])}</>}
    {tab === 'disputes' && <><h2 className="h4">Report a lease issue</h2><form onSubmit={e => { e.preventDefault();void submit('dispute', { contract_id: contractId, description: text }) }} className="card p-4 d-flex flex-column gap-3">{contractSelect}<label>What happened?<textarea required minLength={10} maxLength={5000} className="form-control" rows={5} value={text} onChange={e => setText(e.target.value)} /></label><button disabled={busy || !contractId} className="btn btn-primary align-self-start">Report issue to operations</button></form>{statusRows(['dispute'])}</>}
    {tab === 'reviews' && <><h2 className="h4">Rate a paid lease</h2><form onSubmit={e => { e.preventDefault();void submit('review', { contract_id: contractId, rating, comment: text }, active.find(c => c.id === contractId)?.listing_id || null) }} className="card p-4 d-flex flex-column gap-3">{contractSelect}<label>Rating<select className="form-select" value={rating} onChange={e => setRating(e.target.value)}>{[5,4,3,2,1].map(n => <option key={n}>{n}</option>)}</select></label><label>Your experience<textarea required maxLength={2000} className="form-control" value={text} onChange={e => setText(e.target.value)} /></label><button disabled={busy || !contractId} className="btn btn-primary align-self-start">Submit rating</button></form>{statusRows(['review'])}</>}
    {tab === 'notifications' && <><h2 className="h4">In-app notifications</h2><p>Push and SMS delivery require connected providers; the notices below are saved in your account.</p>{notices.length === 0 && <p>No notifications yet.</p>}{notices.map(n => <div className="card p-3 mb-2" key={n.id}><Link to={n.link}>{n.message}</Link><small>{new Date(n.created_at).toLocaleString()}</small>{!n.read_at && <button className="btn btn-sm btn-outline-secondary align-self-start mt-2" onClick={async () => { const result = await supabase.from('landlease_notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);if (result.error) setError(result.error.message);else await reload() }}>Mark read</button>}</div>)}</>}
    {tab === 'admin' && (isAdmin ? <><h2 className="h4">Operations and verification</h2><p>{listings.filter(l => l.id > 0).length} visible real listings · {contracts.length} agreements · {requests.filter(r => r.status === 'submitted').length} submitted requests</p><Link className="btn btn-outline-primary mb-3" to="/admin/review">Review pending listings</Link><div className="card p-3 mb-3"><label>Decision note<textarea className="form-control" value={adminNote} onChange={e => setAdminNote(e.target.value)} /></label><div className="row g-2 mt-2"><label className="col-md-4">Laboratory (soil report)<input className="form-control" value={laboratory} onChange={e => setLaboratory(e.target.value)} /></label><label className="col-md-4">Report date<input type="date" className="form-control" value={reportDate} onChange={e => setReportDate(e.target.value)} /></label><label className="col-md-4">pH (optional)<input type="number" min={0} max={14} step="0.1" className="form-control" value={ph} onChange={e => setPh(e.target.value)} /></label></div><label className="mt-2">Soil results summary<textarea className="form-control" value={reportText} onChange={e => setReportText(e.target.value)} /></label></div>{requests.filter(r => ['identity','land_proof','soil_test','service','dispute'].includes(r.kind) && !['approved','rejected','completed','resolved'].includes(r.status)).map(r => <article className="card p-3 mb-3" key={r.id}><h3 className="h5">{r.kind.replaceAll('_',' ')} · {r.status}</h3><p className="small">Request #{r.id}<br />Account {r.user_id}{r.listing_id && <> · Plot #{r.listing_id}</>}</p>{!['identity','land_proof'].includes(r.kind) && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.payload, null, 2)}</pre>}{r.payload.path && <button disabled={busy} className="btn btn-outline-primary align-self-start" onClick={() => void openDocument(r)}>Prepare private document link</button>}{docLink?.id === r.id && <><a target="_blank" rel="noreferrer" href={docLink.url}>Open document (link expires after 60 seconds)</a><label className="d-flex gap-2 mt-2"><input type="checkbox" checked={evidenceChecked} onChange={e => setEvidenceChecked(e.target.checked)} />I reviewed the evidence. Completing this decision deletes the upload.</label></>}{['identity','land_proof'].includes(r.kind) && !r.payload.path && <label className="d-flex gap-2"><input type="checkbox" checked={evidenceChecked} onChange={e => setEvidenceChecked(e.target.checked)} />The document was already deleted after review; retry the recorded decision.</label>}<div className="d-flex flex-wrap gap-2 mt-3">{(r.kind === 'soil_test' ? ['scheduled','completed','rejected'] : r.kind === 'dispute' ? ['investigating','resolved','rejected'] : ['approved','rejected']).map(decision => <button key={decision} disabled={busy || (['identity','land_proof'].includes(r.kind) && (!evidenceChecked || (Boolean(r.payload.path) && docLink?.id !== r.id)))} className="btn btn-outline-dark btn-sm" onClick={() => void review(r, decision)}>{decision}</button>)}</div></article>)}<h3 className="h5 mt-4">Recent audit events</h3><div className="table-responsive"><table className="table"><thead><tr><th>Time</th><th>Event</th><th>Record</th></tr></thead><tbody>{audit.map(a => <tr key={a.id}><td>{new Date(a.created_at).toLocaleString()}</td><td>{a.event}</td><td className="small">{a.entity_id}</td></tr>)}</tbody></table></div></> : <p>Admin access required.</p>)}
  </section>
}
