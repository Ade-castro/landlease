import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFlow, type Profile } from '../context/FlowContext'

export function AccountPage() {
  const { profile, loading, signUp, signIn, saveProfile } = useFlow()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [draft, setDraft] = useState<Profile>({
    name: '', email: '', phone: '', role: 'tenant', idSubmitted: false
  })
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [signedInPending, setSignedInPending] = useState(false)

  useEffect(() => { if (profile) setDraft(profile) }, [profile])

  useEffect(() => {
    if (!profile || !signedInPending) return
    setSignedInPending(false)
    const target = params.get('next')
    navigate(
      target?.startsWith('/') && !target.startsWith('//')
        ? target
        : profile.role === 'landowner' ? '/host' : '/discover'
    )
  }, [profile, signedInPending, navigate, params])

  const next = () => {
    const target = params.get('next')
    navigate(
      target?.startsWith('/') && !target.startsWith('//')
        ? target
        : draft.role === 'landowner' ? '/host' : '/discover'
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (profile) {
        await saveProfile(draft)
        setMessage('Contact details saved.')
        return
      }
      if (mode === 'signin') {
        setSignedInPending(true)
        await signIn(draft.email, password)
        return
      }
      await signUp(draft, password)
      setMessage('Check your email for a confirmation link. Then return here to sign in.')
      setMode('signin')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <section className="container-xxl py-5">Loading your account…</section>

  return <section className="container-xxl py-5" style={{ maxWidth: 640 }}>
    <p className="text-primary fw-bold text-uppercase small">Step 1 · Account and contact details</p>
    <h1>{profile ? 'Your contact details' : mode === 'signup' ? 'Create your Landlease account' : 'Sign in to Landlease'}</h1>
    <p className="text-secondary">
      {profile ? 'Your contact details are saved securely with your account.' : 'Use your email and password to access your account across devices.'}
    </p>

    {!profile && <div className="btn-group mb-3">
      <button className={mode === 'signup' ? 'btn btn-dark' : 'btn btn-outline-dark'} onClick={() => { setMode('signup'); setError('') }}>Create account</button>
      <button className={mode === 'signin' ? 'btn btn-dark' : 'btn btn-outline-dark'} onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
    </div>}

    <form onSubmit={submit} className="card border-0 shadow-sm p-4 gap-3 d-flex">
      {(mode === 'signup' || profile) && <>
        <div><label className="form-label">I want to</label>
          <select className="form-select" disabled={!!profile} value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as Profile['role'] })}>
            <option value="tenant">Find land to lease</option>
            <option value="landowner">List my land</option>
          </select>
        </div>
        <div><label className="form-label">Full name</label><input required className="form-control" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
        <div><label className="form-label">Phone</label><input required type="tel" className="form-control" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></div>
      </>}

      <div><label className="form-label">Email</label><input required type="email" className="form-control" disabled={!!profile} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
      {!profile && <div><label className="form-label">Password</label>
        <input required minLength={8} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="form-text">At least 8 characters.</div>
      </div>}

      {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
      {message && <div className="alert alert-success mb-0" role="status">{message}</div>}
      <button className="btn btn-primary rounded-pill" disabled={busy} type="submit">{busy ? 'Please wait…' : profile ? 'Save details' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
      {profile && <button className="btn btn-link" type="button" onClick={next}>Continue →</button>}
    </form>
  </section>
}