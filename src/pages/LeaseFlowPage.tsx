import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { useListings } from '../context/ListingsContext'

export function LeaseFlowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, cases, change } = useFlow()
  const { getListing } = useListings()
  const item = cases.find(c => c.id === Number(id))
  const listing = item && getListing(item.listingId)
  const [date, setDate] = useState('')
  const [offer, setOffer] = useState(item?.offer || '')
  const [witness, setWitness] = useState(item?.witnessName || '')
  if (!profile) return <section className="container-xxl py-5"><h1>Complete your profile first</h1><Link to={'/account?next=' + encodeURIComponent('/lease/' + id)}>Continue to onboarding</Link></section>
  if (!item || !listing) return <section className="container-xxl py-5">Lease request not found. <Link to="/discover">Discover land</Link></section>
  const owner = profile.role === 'landowner'
  const signed = Boolean(item.tenantSignedAt && item.ownerSignedAt)
  return <section className="container-xxl py-5" style={{ maxWidth: 850 }}>
    <p className="text-primary fw-bold text-uppercase small">Visit → negotiation → witnesses → signatures → payment</p>
    <h1>{listing.name}</h1><p className="text-secondary">{listing.area} · {listing.price} · Request #{item.id}</p>
    <div className="alert alert-info">Prototype workflow: saved only in this browser. The other party cannot receive requests or sign remotely yet. No legal contract or payment is created here.</div>
    <div className="card p-4 mb-3"><h2 className="h4">1. Farm visit <span className="small text-secondary">(optional, recommended)</span></h2>
      <p>Status: <strong>{item.visitStatus}</strong>{item.visitDate && ' · ' + item.visitDate}</p>
      {!owner && <div className="d-flex gap-2 flex-wrap"><input type="datetime-local" className="form-control" style={{ maxWidth: 250 }} value={date} onChange={e => setDate(e.target.value)} /><button className="btn btn-outline-primary" disabled={!date} onClick={() => change(item.id, { visitDate: date, visitStatus: 'requested' })}>Request visit</button></div>}
      {owner && item.visitStatus === 'requested' && <div className="d-flex gap-2"><button className="btn btn-primary" onClick={() => change(item.id, { visitStatus: 'confirmed' })}>Confirm</button><button className="btn btn-outline-secondary" onClick={() => change(item.id, { visitStatus: 'declined' })}>Decline</button></div>}
      <p className="small text-secondary mt-2 mb-0">You may continue to lease terms without a visit.</p>
    </div>
    <div className="card p-4 mb-3"><h2 className="h4">2. Propose lease terms</h2><p>Listing price: {listing.price}. Enter the agreed rent and duration, plus any conditions.</p>
      <textarea className="form-control mb-2" rows={3} value={offer} onChange={e => setOffer(e.target.value)} placeholder="Example: USD 180 for Jun–Nov 2026, borehole included" />
      <button className="btn btn-outline-primary align-self-start" disabled={!offer.trim()} onClick={() => change(item.id, { offer: offer.trim(), status: 'negotiating', tenantSignedAt: undefined, ownerSignedAt: undefined })}>Save proposed terms</button>
      {item.offer && <div className="mt-3"><strong>Current proposal:</strong> {item.offer}<div className="mt-2"><button className="btn btn-primary" onClick={() => change(item.id, { status: 'agreed' })}>Mark terms agreed</button></div></div>}
    </div>
    <div className="card p-4 mb-3"><h2 className="h4">3. Witnesses and signatures</h2><p className="small text-secondary">Both parties should review a legally approved contract before signing. The entries below demonstrate the intended order only.</p>
      <label className="form-label">Witness name</label><input className="form-control mb-2" value={witness} onChange={e => setWitness(e.target.value)} placeholder="Full name of witness" />
      <button className="btn btn-outline-secondary align-self-start mb-3" disabled={!witness.trim()} onClick={() => change(item.id, { witnessName: witness.trim() })}>Save witness</button>
      <p>Tenant: {item.tenantSignedAt ? 'Recorded ' + new Date(item.tenantSignedAt).toLocaleString() : 'Pending'}<br />Landowner: {item.ownerSignedAt ? 'Recorded ' + new Date(item.ownerSignedAt).toLocaleString() : 'Pending'}</p>
      <button className="btn btn-primary align-self-start" disabled={item.status !== 'agreed' || !item.witnessName || (owner ? !!item.ownerSignedAt : !!item.tenantSignedAt)} onClick={() => change(item.id, owner ? { ownerSignedAt: new Date().toISOString() } : { tenantSignedAt: new Date().toISOString() })}>Record my {owner ? 'landowner' : 'tenant'} acknowledgment</button>
    </div>
    <div className="card p-4"><h2 className="h4">4. Payment</h2><p>{signed ? 'Both acknowledgments are recorded.' : 'Payment follows both signatures.'}</p><button className="btn btn-secondary align-self-start" disabled>Pay now · provider not connected</button><p className="small text-secondary mt-2 mb-0">A licensed payment provider, commission split, receipts and secure signature service are required before this step can be enabled.</p></div>
    <button className="btn btn-link mt-3" onClick={() => navigate('/listing/' + listing.id)}>Back to listing</button>
  </section>
}
