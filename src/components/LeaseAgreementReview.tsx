import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Witness = { party: 'tenant' | 'landowner'; full_name: string }

export function LeaseAgreementReview({ negotiationId, terms }: { negotiationId: number; terms: string }) {
  const [witnesses, setWitnesses] = useState<Witness[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: loadError } = await supabase.from('lease_witnesses')
        .select('party,full_name').eq('negotiation_id', negotiationId)
      if (!active) return
      setLoading(false)
      if (loadError) setError(loadError.message)
      else { setWitnesses(data || []); setError('') }
    }
    void load()
    const timer = window.setInterval(() => { void load() }, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [negotiationId])

  const ready = witnesses.some(w => w.party === 'tenant') && witnesses.some(w => w.party === 'landowner')
  return <section className="card p-4 mt-3" aria-label="Agreement review">
    <h2 className="h5">Agreement review</h2>
    <p className="small text-secondary">Review the accepted terms together before preparing a lease agreement.</p>
    <div className="border rounded p-3" style={{ whiteSpace: 'pre-wrap' }}>{terms}</div>
    {loading ? <p className="mt-3">Checking witnesses…</p> : error ?
      <p className="text-danger mt-3" role="alert">Could not check witnesses: {error}</p> :
      <p className="mt-3">{ready ? 'Both witnesses have been nominated.' : 'Both parties must nominate a witness before the agreement can be prepared.'}</p>}
    <p className="alert alert-warning mb-0">This is a review of accepted terms, not a lease agreement or electronic signature. No payment is due here.</p>
  </section>
}
