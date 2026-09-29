import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { errorText, type Contract } from './models'

export function ContractPanel({ negotiationId, owner, listingName }: { negotiationId: number; owner: boolean; listingName: string }) {
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [tenure, setTenure] = useState('private')
  const [body, setBody] = useState(`AGRICULTURAL LAND LEASE — ${listingName}\n\nLand and boundaries: [identify the plot and attach the recorded boundary].\nAuthority to lease: [state the land tenure, title or permission and required consents].\nPermitted use: [record agreed crops and activities].\nRent and payment schedule: [record total value, instalments and currency].\nWater, access and equipment: [record inclusions and any separate charges].\nResponsibilities: [record repairs, utilities, soil care and insurance].\nTermination: [record notice, breach and remedy periods].\nDisputes: [record the agreed resolution process and applicable law].\nEnd of lease: [record return of land and treatment of crops or improvements].\n\nBoth parties must review the full agreement and obtain appropriate legal advice before accepting.`)
  useEffect(() => {
    let active = true
    void supabase.from('landlease_contracts').select('*').eq('negotiation_id', negotiationId).maybeSingle().then(({ data, error: e }) => {
      if (!active) return
      if (e) setError('Contract setup is required: ' + e.message)
      else setContract(data as Contract | null)
    })
    return () => { active = false }
  }, [negotiationId])
  async function create(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      if (body.includes('[') || body.includes(']')) throw new Error('Replace all bracketed fields with the agreed details before creating the agreement.')
      const { data, error: saveError } = await supabase.rpc('create_landlease_contract', { p_negotiation_id: negotiationId, p_body: body, p_amount: Number(amount), p_start: start, p_end: end, p_tenure: tenure })
      if (saveError) throw saveError
      navigate('/contract/' + data)
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }
  return <section className="card p-4 mt-3"><h2 className="h5">Lease agreement</h2>
    {contract ? <Link className="btn btn-primary align-self-start" to={'/contract/' + contract.id}>Review agreement · {contract.status.replaceAll('_', ' ')}</Link> : owner ? <form className="d-flex flex-column gap-3" onSubmit={e => void create(e)}>
      <p className="small text-secondary">Prepare a fixed agreement after both identities, land rights and witnesses have been reviewed. The generated document records account acceptance; legal enforceability and required land consents need professional review.</p>
      <label>Land tenure<select className="form-select" value={tenure} onChange={e => setTenure(e.target.value)}><option value="private">Private title</option><option value="state">State land</option><option value="communal">Communal land</option></select></label>
      <div className="row g-2"><label className="col-sm-4">Total lease value USD<input required type="number" min="0.01" max="1000000" step="0.01" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} /></label><label className="col-sm-4">Start date<input required type="date" className="form-control" value={start} onChange={e => setStart(e.target.value)} /></label><label className="col-sm-4">End date<input required type="date" min={start} className="form-control" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
      <label>Full agreement<textarea required rows={14} minLength={100} maxLength={20000} className="form-control" value={body} onChange={e => setBody(e.target.value)} /></label>
      <button disabled={busy} className="btn btn-primary align-self-start">Create agreement for both parties</button>
    </form> : <p>The landowner will prepare an agreement. Complete your <Link to="/workspace?tab=verification">identity review</Link> first.</p>}
    {error && <p role="alert" className="text-danger mt-3">{error}</p>}
  </section>
}
