import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFlow, type Profile } from '../context/FlowContext'

export function AccountPage() {
  const { profile, saveProfile } = useFlow()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState<Profile>(profile || { name: '', email: '', phone: '', role: 'tenant', idSubmitted: false })
  const submit = (event: FormEvent) => {
    event.preventDefault(); saveProfile(draft)
    const next = params.get('next')
    navigate(next?.startsWith('/') && !next.startsWith('//') ? next : draft.role === 'landowner' ? '/host' : '/discover')
  }
  return <section className="container-xxl py-5" style={{ maxWidth: 640 }}>
    <p className="text-primary fw-bold text-uppercase small">Step 1 · Entry and onboarding</p>
    <h1>Create your Landlease profile</h1>
    <p className="text-secondary">Choose how you will use the marketplace. This prototype saves your details in this browser only; it does not create a secure account.</p>
    <form onSubmit={submit} className="card border-0 shadow-sm p-4 gap-3 d-flex">
      <div><label className="form-label">I want to</label><select className="form-select" value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as Profile['role'] })}><option value="tenant">Find land to lease</option><option value="landowner">List my land</option></select></div>
      <div><label className="form-label">Full name</label><input required className="form-control" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
      <div><label className="form-label">Email</label><input required type="email" className="form-control" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
      <div><label className="form-label">Phone</label><input required type="tel" className="form-control" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
      <label className="d-flex gap-2 small"><input type="checkbox" checked={draft.idSubmitted} onChange={e => setDraft({ ...draft, idSubmitted: e.target.checked })} /> I am ready to submit identity documents for verification. This checkbox does not verify my identity.</label>
      <button className="btn btn-primary rounded-pill" type="submit">Continue</button>
    </form>
    <p className="small text-secondary mt-3">Identity uploads, account authentication and admin review require a secure server before launch.</p>
  </section>
}
