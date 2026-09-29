import { Link } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { useListings } from '../context/ListingsContext'
import { useVisits } from '../hooks/useVisits'

export function MyVisitsPage() {
  const { user, profile } = useFlow()
  const { visits, loading, error } = useVisits()
  const { getListing } = useListings()
  const mine = visits.filter(item => item.tenant_id === user?.id)

  return <section className="container-xxl py-5" style={{ maxWidth: 820 }}>
    <h1>My farm visits</h1>
    {!user ? <p><Link to="/account?next=%2Fmy-visits">Sign in</Link> to see your visit requests.</p> : profile?.role !== 'tenant' ? <p>This page is for tenant accounts.</p> : <>
      {loading && <p>Loading visits…</p>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!loading && !error && mine.length === 0 && <p>No visit requests yet. <Link to="/discover">Find land</Link></p>}
      {mine.map(item => <article key={item.id} className="card p-4 mb-3">
        <h2 className="h5">{getListing(item.listing_id)?.name || `Plot #${item.listing_id}`}</h2>
        <p className="mb-1">Status: <strong>{item.status}</strong></p>
        <p className="text-secondary mb-3">Requested time: {new Date(item.requested_at).toLocaleString()}{item.proposed_at && <><br />Landowner suggested: {new Date(item.proposed_at).toLocaleString()}</>}</p>
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-outline-primary btn-sm" to={`/listing/${item.listing_id}/visit`}>Visit details</Link>
          {item.status === 'confirmed' && <Link className="btn btn-primary btn-sm" to={`/negotiation/${item.id}`}>Lease terms and messages</Link>}
        </div>
      </article>)}
    </>}
  </section>
}
