import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { useListings } from '../context/ListingsContext'
import { useVisits } from '../hooks/useVisits'
import { supabase } from '../lib/supabase'

type Negotiation = {
  id: number; visit_id: number; owner_id: string; tenant_id: string
  terms: string; tenant_message: string | null
  status: 'sent' | 'countered' | 'accepted' | 'declined'; expires_at: string
}

export function NegotiationPage() {
  const visitId = Number(useParams().visitId)
  const { user } = useFlow()
  const { visits, loading: visitLoading } = useVisits()
  const { getListing, loading: listingLoading } = useListings()
  const [record, setRecord] = useState<Negotiation | null>(null)
  const [terms, setTerms] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const visit = visits.find(item => item.id === visitId)
  const listing = visit && getListing(visit.listing_id)
  const owner = Boolean(user && visit?.owner_id === user.id)
  const expired = Boolean(record && Date.now() >= new Date(record.expires_at).getTime())

  const reload = useCallback(async () => {
    if (!user || !Number.isSafeInteger(visitId)) { setLoading(false); return }
    const { data, error: fetchError } = await supabase.from('lease_negotiations').select('*').eq('visit_id', visitId).maybeSingle()
    if (fetchError) setError(fetchError.message)
    else { setRecord(data); setError(''); if (data) setTerms(current => current || data.terms) }
    setLoading(false)
  }, [user?.id, visitId])

  useEffect(() => {
    void reload()
    const interval = window.setInterval(() => { void reload() }, 30000)
    return () => window.clearInterval(interval)
  }, [reload])

  async function send(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const { error: sendError } = await supabase.rpc('send_lease_terms', { p_visit_id: visitId, p_terms: terms })
    if (sendError) setError(sendError.message)
    else await reload()
    setBusy(false)
  }
  async function respond(action: 'accept' | 'decline' | 'counter') {
    if (!record) return
    setBusy(true); setError('')
    const { error: responseError } = await supabase.rpc('respond_lease_terms', { p_id: record.id, p_action: action, p_message: action === 'counter' ? message : null })
    if (responseError) setError(responseError.message)
    else await reload()
    setBusy(false)
  }

  if (!user) return <section className="container-xxl py-5"><Link to="/account">Sign in</Link> to see this negotiation.</section>
  if (loading || listingLoading || visitLoading) return <section className="container-xxl py-5">Loading negotiation…</section>
  if (!visit || !listing || visit.status !== 'confirmed') return <section className="container-xxl py-5">A confirmed farm visit is needed before lease terms can be sent. <Link to="/discover">Discover land</Link></section>

  return <section className="container-xxl py-5" style={{ maxWidth: 760 }}>
    <p className="text-primary fw-bold text-uppercase small">Lease terms</p>
    <h1>{listing.name}</h1>
    <p className="text-secondary">{listing.area} · Visit #{visit.id}</p>
    <div className="alert alert-info">These are preliminary terms for negotiation. An accepted proposal is not a signed lease or a payment request.</div>
    {record && <div className="card p-4 mb-3">
      <h2 className="h5">Current proposal</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{record.terms}</p>
      <p className="mb-1">Status: <strong>{expired && record.status !== 'accepted' ? 'Response window expired' : record.status}</strong></p>
      <p className="mb-0 small text-secondary">72-hour deadline: {new Date(record.expires_at).toLocaleString()}</p>
      {record.tenant_message && <p className="mt-3 mb-0"><strong>Tenant requested changes:</strong> {record.tenant_message}</p>}
    </div>}
    {owner && (!record || (record.status === 'countered' && !expired)) && <form className="card p-4 d-flex gap-3 mb-3" onSubmit={event => void send(event)}>
      <h2 className="h5 mb-0">{record ? 'Revise your terms' : 'Send lease terms to the tenant'}</h2>
      <label htmlFor="terms">Rent, duration, amenities, and other conditions</label>
      <textarea id="terms" className="form-control" required minLength={20} maxLength={5000} rows={6} value={terms} onChange={event => setTerms(event.target.value)} placeholder="Example: USD 180 per month for June to November; borehole access included…" />
      <button className="btn btn-primary align-self-start" disabled={busy || terms.trim().length < 20}>Send terms</button>
    </form>}
    {!owner && record?.status === 'sent' && !expired && <div className="card p-4 d-flex gap-3">
      <h2 className="h5 mb-0">Your response</h2>
      <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary" disabled={busy} onClick={() => void respond('accept')}>Accept terms</button><button className="btn btn-outline-danger" disabled={busy} onClick={() => void respond('decline')}>Decline</button></div>
      <label htmlFor="counter">Ask the landowner to revise the terms</label>
      <textarea id="counter" className="form-control" minLength={10} maxLength={5000} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="Describe the changes you need…" />
      <button className="btn btn-outline-primary align-self-start" disabled={busy || message.trim().length < 10} onClick={() => void respond('counter')}>Request changes</button>
    </div>}
    {!owner && !record && <p>The landowner has not sent lease terms yet.</p>}
    {record?.status === 'accepted' && <p className="alert alert-success mt-3">Both parties can now prepare a contract and witnesses. Signing is not available yet.</p>}
    {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
  </section>
}
