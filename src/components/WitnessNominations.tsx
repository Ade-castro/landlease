import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'

type Witness = { party: 'tenant' | 'landowner'; full_name: string; phone: string; national_id: string }

export function WitnessNominations({ negotiationId, ownerId }: { negotiationId: number; ownerId: string }) {
  const { user } = useFlow()
  const party = user?.id === ownerId ? 'landowner' : 'tenant'
  const [witnesses, setWitnesses] = useState<Witness[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const reload = useCallback(async () => {
    const { data, error: loadError } = await supabase.from('lease_witnesses')
      .select('party,full_name,phone,national_id').eq('negotiation_id', negotiationId)
    if (loadError) setError(loadError.message)
    else { setWitnesses(data || []); setError('') }
  }, [negotiationId])
  useEffect(() => { void reload() }, [reload])

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const { error: saveError } = await supabase.rpc('nominate_lease_witness', {
      p_negotiation_id: negotiationId, p_name: name, p_phone: phone,
      p_national_id: nationalId, p_consent_declared: consent,
    })
    if (saveError) setError(saveError.message)
    else { setMessage('Witness details saved.'); await reload() }
    setBusy(false)
  }

  return <section className="card p-4 mt-3">
    <h2 className="h5">Witnesses</h2>
    <p className="small text-secondary">Each party supplies their own witness. Details are shared only with the tenant and landowner. This step does not verify a witness or sign a contract.</p>
    {(['tenant', 'landowner'] as const).map(role => {
      const witness = witnesses.find(item => item.party === role)
      return <p key={role} className="mb-1"><strong>{role === 'tenant' ? 'Tenant' : 'Landowner'} witness:</strong> {witness ? `${witness.full_name} · ${witness.phone} · ID ending ${witness.national_id.slice(-4)}` : 'Not added yet'}</p>
    })}
    <form className="d-flex flex-column gap-2 mt-3" onSubmit={event => void save(event)}>
      <h3 className="h6">Add your {party} witness</h3>
      <label htmlFor="witness-name">Full name</label><input id="witness-name" required className="form-control" maxLength={120} value={name} onChange={event => setName(event.target.value)} />
      <label htmlFor="witness-phone">Phone</label><input id="witness-phone" required type="tel" className="form-control" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} />
      <label htmlFor="witness-id">National ID number</label><input id="witness-id" required className="form-control" maxLength={80} value={nationalId} onChange={event => setNationalId(event.target.value)} />
      <label className="d-flex gap-2 small"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /> I have the witness’s permission to share these details with the other party.</label>
      <button className="btn btn-outline-primary align-self-start" type="submit" disabled={busy || !consent}>Save my witness</button>
    </form>
    {message && <p className="text-success mt-2" role="status">{message}</p>}
    {error && <p className="text-danger mt-2" role="alert">{error}</p>}
  </section>
}
