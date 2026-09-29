import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'

type ReviewListing = {
  id: number; name: string; area: string; image: string; description: string
  owner_id: string; proof_declared: boolean; created_at: string
  verification_status: string
}

export function AdminReviewPage() {
  const { user, loading: authLoading } = useFlow()
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ReviewListing[]>([])
  const [busy, setBusy] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    let active = true
    async function load() {
      setLoading(true)
      if (!user) { setAllowed(false); setLoading(false); return }
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_landlease_admin')
      if (!active) return
      if (adminError) { setError(adminError.message); setLoading(false); return }
      setAllowed(Boolean(isAdmin))
      if (isAdmin) {
        const { data, error: listError } = await supabase.from('listings').select('id,name,area,image,description,owner_id,proof_declared,created_at,verification_status').eq('verification_status', 'pending').order('created_at', { ascending: true })
        if (!active) return
        if (listError) setError(listError.message)
        else { setItems(data || []); setError('') }
      }
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [user?.id, authLoading])

  async function review(id: number, decision: 'approved' | 'rejected') {
    setBusy(id)
    setError('')
    const { error: reviewError } = await supabase.rpc('review_landlease_listing', { p_id: id, p_decision: decision })
    if (reviewError) setError(reviewError.message)
    else setItems(current => current.filter(item => item.id !== id))
    setBusy(null)
  }

  return <section className="container-xxl py-5" style={{ maxWidth: 900 }}>
    <h1 className="h2">Listing review</h1>
    <Link to="/workspace?tab=admin" className="btn btn-outline-primary mb-3">Identity, land rights and soil-test review</Link>
    {loading || authLoading ? <p>Loading…</p> : !user ? <p>Sign in to review listings. <Link to="/account">Sign in</Link></p> : !allowed ? <p>This page is for Landlease administrators.</p> : <>
      <p className="text-secondary">Complete identity and land-right review and record a real laboratory report in Admin operations before approving a public listing. Check actual photos and required permissions.</p>
      {items.length === 0 && <p>No listings awaiting review.</p>}
      {items.map(item => <article key={item.id} className="card p-3 mb-3">
        {item.image && <img src={item.image} alt={item.name} style={{ maxHeight: 280, objectFit: 'cover' }} className="rounded mb-3" />}
        <h2 className="h4">{item.name}</h2>
        <p className="mb-1">{item.area} · Listing #{item.id}</p>
        <p className="mb-1">{item.description}</p>
        <p className="small text-secondary">Owner account: {item.owner_id}<br />Ownership declaration: {item.proof_declared ? 'Checked' : 'Missing'}</p>
        <p className="small text-danger">A checked declaration alone does not verify identity or rights to lease this land. Contact the owner and examine evidence outside this page before approval.</p>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={busy === item.id} onClick={() => void review(item.id, 'approved')}>Approve verified listing</button>
          <button className="btn btn-outline-danger" disabled={busy === item.id} onClick={() => void review(item.id, 'rejected')}>Reject</button>
        </div>
      </article>)}
    </>}
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
  </section>
}
