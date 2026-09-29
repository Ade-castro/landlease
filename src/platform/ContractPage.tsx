import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'
import { supabase } from '../lib/supabase'
import { errorText, type Contract, type PaymentOrder } from './models'

export function ContractPage() {
  const { id } = useParams()
  const { user, profile, loading: authLoading } = useFlow()
  const [record, setRecord] = useState<Contract | null>(null)
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    if (!user || !id) { setLoading(false); return }
    const [c, p] = await Promise.all([supabase.from('landlease_contracts').select('*').eq('id', id).maybeSingle(), supabase.from('lease_payment_orders').select('*').eq('contract_id', id).maybeSingle()])
    if (c.error || p.error) setError(c.error?.message || p.error?.message || '')
    else { setRecord(c.data as Contract | null); setOrder(p.data as PaymentOrder | null); setError('') }
    setLoading(false)
  }, [user?.id, id])
  useEffect(() => { void reload(); const timer = window.setInterval(() => { void reload() }, 15000); return () => window.clearInterval(timer) }, [reload])
  async function act(kind: 'sign' | 'payment') {
    if (!record) return
    setBusy(true); setError('')
    try {
      const result = kind === 'sign' ? await supabase.rpc('sign_landlease_contract', { p_id: record.id, p_name: name, p_consent: consent }) : await supabase.rpc('create_lease_payment_order', { p_contract_id: record.id })
      if (result.error) throw result.error
      await reload()
    } catch (cause) { setError(errorText(cause)) } finally { setBusy(false) }
  }
  if (authLoading || loading) return <section className="container py-5">Loading agreement…</section>
  if (!user) return <section className="container py-5"><Link to="/account">Sign in</Link> to see your agreement.</section>
  if (!record) return <section className="container py-5">Agreement not found or access denied. {error && <p role="alert">{error}</p>}</section>
  const owner = user.id === record.owner_id
  const signed = owner ? record.owner_signed_at : record.tenant_signed_at
  const both = Boolean(record.owner_signed_at && record.tenant_signed_at)
  return <section className="container-xxl py-5" style={{ maxWidth: 950 }}>
    <Link to="/workspace?tab=contracts">← My agreements</Link><h1 className="mt-3">Lease agreement</h1>
    <p>Agreement #{record.id} · <strong>{record.status.replaceAll('_', ' ')}</strong></p>
    <p>{record.start_date} to {record.end_date} · {record.currency} {Number(record.amount).toFixed(2)} · {record.tenure} land</p>
    <div className="card p-4 mb-3" style={{ whiteSpace: 'pre-wrap' }}>{record.body}</div>
    <div className="card p-4 mb-3"><h2 className="h5">Witness nominations</h2>{record.witnesses.map(w => <p key={w.party}>{w.party}: {w.name} · {w.phone} · ID ending {w.id_last_four}</p>)}<p className="small text-secondary mb-0">Witness nominations are not witness signatures or identity verification.</p></div>
    <div className="card p-4 mb-3"><h2 className="h5">Account acceptance</h2><p>Landowner: {record.owner_signed_at ? `${record.owner_name} · ${new Date(record.owner_signed_at).toLocaleString()}` : 'Awaiting acceptance'}</p><p>Tenant: {record.tenant_signed_at ? `${record.tenant_name} · ${new Date(record.tenant_signed_at).toLocaleString()}` : 'Awaiting acceptance'}</p>
      {!signed && <><label>Full name<input className="form-control mb-2" value={name} placeholder={profile?.name || ''} onChange={e => setName(e.target.value)} /></label><label className="d-flex gap-2 mb-3"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I have read this fixed agreement, confirm the details and consent to record my acceptance using this account.</label><button disabled={busy || !consent || name.trim().length < 3} className="btn btn-primary align-self-start" onClick={() => void act('sign')}>Record my acceptance</button></>}
      <p className="small text-secondary mt-3 mb-0">Account acceptance is timestamped and logged. This implementation does not certify legal enforceability or replace a legally approved signing process.</p>
    </div>
    <div className="card p-4 mb-3"><h2 className="h5">Payment and commission</h2><p>Total: USD {Number(record.amount).toFixed(2)} · Landlease 3%: USD {(Math.round(Number(record.amount) * 3) / 100).toFixed(2)} · Landowner: USD {(Number(record.amount) - Math.round(Number(record.amount) * 3) / 100).toFixed(2)}</p>
      {!both && <p>Payment is locked until both parties accept.</p>}
      {both && !owner && !order && <button disabled={busy} className="btn btn-outline-primary align-self-start" onClick={() => void act('payment')}>Prepare payment order</button>}
      {order?.status === 'paid' ? <><p className="text-success">Paid · Provider reference {order.provider_reference} · {order.paid_at && new Date(order.paid_at).toLocaleString()}</p><p>Receipt #{order.id}<br />Amount USD {Number(order.amount).toFixed(2)}<br />Commission USD {Number(order.commission).toFixed(2)}<br />Landowner allocation USD {Number(order.landowner_amount).toFixed(2)}</p><button className="btn btn-outline-dark align-self-start" onClick={() => window.print()}>Print receipt and agreement</button></> : both && <p className="alert alert-warning mb-0 mt-2">Live payment is unavailable until a licensed gateway with direct merchant settlement and commission splitting is connected. No money has been collected. An order alone does not activate the lease.</p>}
    </div>
    {record.status === 'active' && <Link className="btn btn-primary" to="/workspace?tab=planning">Plan this season</Link>}
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
  </section>
}
