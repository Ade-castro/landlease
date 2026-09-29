import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { useListings } from '../context/ListingsContext'
import { useVisits } from '../hooks/useVisits'
import { supabase } from '../lib/supabase'

export function FarmVisitPage() {
  const { id } = useParams()
  const listingId = Number(id)
  const { profile, user } = useFlow()
  const { getListing, loading: listingsLoading } = useListings()
  const { visits, loading: visitsLoading, reload } = useVisits()
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const listing = getListing(listingId)
  const visit = visits.find(item => item.listing_id === listingId && item.tenant_id === user?.id)

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true)
    try {
      const { error: requestError } = await supabase.rpc('request_farm_visit', {
        p_listing_id: listingId, p_date: new Date(date).toISOString(),
      })
      if (requestError) throw requestError
      await reload()
      setMessage('Visit request sent to the landowner.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not request a visit.') }
    finally { setBusy(false) }
  }

  const respond = async (action: 'accept' | 'decline') => {
    if (!visit) return
    setBusy(true); setError('')
    try {
      const { error: responseError } = await supabase.rpc('respond_farm_visit', { p_id: visit.id, p_action: action })
      if (responseError) throw responseError
      await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not respond.') }
    finally { setBusy(false) }
  }

  if (listingsLoading || visitsLoading) return <section className="container-xxl py-5">Loading visit details…</section>
  if (!listing || listing.verificationStatus !== 'approved') return <section className="container-xxl py-5">This listing is not available for visit requests. <Link to="/discover">Discover land</Link></section>
  if (!profile) return <section className="container-xxl py-5"><h1>Sign in to request a visit</h1><Link to={'/account?next=' + encodeURIComponent(`/listing/${listingId}/visit`)}>Sign in or create an account</Link></section>
  if (profile.role !== 'tenant') return <section className="container-xxl py-5">Use a tenant account to request a farm visit.</section>

  return <section className="container-xxl py-5" style={{ maxWidth: 680 }}>
    <p className="text-primary fw-bold text-uppercase small">Farm visit</p>
    <h1>{listing.name}</h1>
    <p className="text-secondary">{listing.area} · {listing.size}</p>
    {visit && <div className="card p-4 mb-4">
      <h2 className="h5">Your visit request</h2>
      <p className="mb-1">Status: <strong>{visit.status}</strong></p>
      <p className="mb-1">Requested: {new Date(visit.requested_at).toLocaleString()}</p>
      {visit.proposed_at && <p>Landowner suggested: {new Date(visit.proposed_at).toLocaleString()}</p>}
      {visit.status === 'proposed' && <div className="d-flex gap-2">
        <button className="btn btn-primary" disabled={busy} onClick={() => void respond('accept')}>Accept new time</button>
        <button className="btn btn-outline-secondary" disabled={busy} onClick={() => void respond('decline')}>Decline</button>
      </div>}
    </div>}
    <form className="card p-4 d-flex gap-3" onSubmit={submit}>
      <h2 className="h5 mb-0">{visit ? 'Request another time' : 'Request a farm visit'}</h2>
      <p className="text-secondary mb-0">A visit is optional. The landowner can confirm, decline, or suggest another time.</p>
      <div><label htmlFor="visit-date" className="form-label">Preferred date and time</label>
        <input id="visit-date" required type="datetime-local" className="form-control" value={date} onChange={event => setDate(event.target.value)} /></div>
      {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
      {message && <div className="alert alert-success mb-0" role="status">{message}</div>}
      <button type="submit" className="btn btn-primary rounded-pill" disabled={busy || !date}>{busy ? 'Sending…' : 'Send request'}</button>
    </form>
  </section>
}
