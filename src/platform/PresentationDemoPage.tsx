import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFlow } from '../context/FlowContext'

const DEMO_PASSWORD = 'LandleaseDemo2026!'
const LANDOWNER_EMAIL = 'mukundwib1+demolandowner@gmail.com'
const TENANT_EMAIL = 'mukundwib1+demotenant@gmail.com'

type Step = { title: string; account: string; body: React.ReactNode }

export function PresentationDemoPage() {
  const { user, profile, signIn } = useFlow()
  const [busy, setBusy] = useState<'landowner' | 'tenant' | null>(null)
  const [error, setError] = useState('')

  async function quickSignIn(which: 'landowner' | 'tenant') {
    setBusy(which); setError('')
    try { await signIn(which === 'landowner' ? LANDOWNER_EMAIL : TENANT_EMAIL, DEMO_PASSWORD) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sign in.') }
    finally { setBusy(null) }
  }

  const steps: Step[] = [
    {
      title: '1. Sign in as the demo landowner',
      account: 'Demo landowner',
      body: <p>Use the button above, or sign in manually at <Link to="/account">/account</Link> with <code>{LANDOWNER_EMAIL}</code>.</p>,
    },
    {
      title: '2. List land with a real map boundary',
      account: 'Demo landowner',
      body: <p><Link to="/host/new" className="btn btn-primary btn-sm">Open the listing wizard</Link> — draw at least three corners on the map, add a photo, and submit. This creates a real row in your <code>listings</code> table with <code>verification_status = 'pending'</code>.</p>,
    },
    {
      title: '3. Submit identity, land-rights and a soil-test request',
      account: 'Demo landowner',
      body: <p><Link to="/workspace?tab=verification" className="btn btn-primary btn-sm me-2">Verification tab</Link><Link to="/workspace?tab=soil" className="btn btn-outline-primary btn-sm">Soil tests tab</Link> — upload a document for each (do not use a real ID), then request a soil test for the plot you just listed.</p>,
    },
    {
      title: '4. Review and approve as admin',
      account: 'Your real admin account',
      body: <p>Sign out of the demo account and sign in as yourself at <Link to="/account">/account</Link> (only your account passes <code>is_landlease_admin()</code>). Then: <Link to="/workspace?tab=admin" className="btn btn-outline-dark btn-sm me-2">Approve identity, land rights &amp; record the soil test</Link><Link to="/admin/review" className="btn btn-outline-dark btn-sm">Approve the listing</Link></p>,
    },
    {
      title: '5. Sign in as the demo tenant and request a visit',
      account: 'Demo tenant',
      body: <p>Use the button above. Then find the plot on <Link to="/discover">Discover land</Link>, open it, and request a farm visit.</p>,
    },
    {
      title: '6. Confirm the visit as the landowner',
      account: 'Demo landowner',
      body: <p>Sign back in as the landowner and confirm the request on <Link to="/host" className="btn btn-outline-primary btn-sm">your host dashboard</Link>.</p>,
    },
    {
      title: '7. Negotiate terms',
      account: 'Both, in turn',
      body: <p>Once confirmed, both sides see a "Lease terms" link to the same negotiation page. The landowner sends terms; the tenant accepts, counters, or declines.</p>,
    },
    {
      title: '8. Nominate witnesses and create the agreement',
      account: 'Both, in turn',
      body: <p>Once terms are accepted, witness nomination and agreement creation appear on the same negotiation page. The landowner fills in the fixed agreement text.</p>,
    },
    {
      title: '9. Both sides sign, then simulate payment',
      account: 'Both, in turn',
      body: <p>On the resulting <code>/contract/:id</code> page, each side records their acceptance. Once both have signed, the tenant can use <strong>Simulate demo payment</strong> — this really calls your database, tagged with a <code>DEMO-</code> reference, and activates the lease for real.</p>,
    },
    {
      title: '10. Season plan, directory, disputes and ratings',
      account: 'Either',
      body: <p><Link to="/workspace?tab=planning" className="btn btn-outline-primary btn-sm me-2">Season plan</Link><Link to="/directory" className="btn btn-outline-primary btn-sm me-2">Directory</Link><Link to="/workspace?tab=disputes" className="btn btn-outline-primary btn-sm me-2">Disputes</Link><Link to="/workspace?tab=reviews" className="btn btn-outline-primary btn-sm">Ratings</Link> — all real, tied to the now-active lease.</p>,
    },
  ]

  return <section className="container-xxl py-5" style={{ maxWidth: 900 }}>
    <p className="text-primary fw-bold small text-uppercase">Live demo script</p>
    <h1>Landlease complete walkthrough — real accounts, real database</h1>

    <div className="card p-3 mb-4">
      <p className="mb-2"><strong>Signed in as:</strong> {user ? `${profile?.name ?? user.email} (${profile?.role ?? 'no profile yet'})` : 'nobody'}</p>
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-dark btn-sm" disabled={busy !== null} onClick={() => void quickSignIn('landowner')}>{busy === 'landowner' ? 'Signing in…' : 'Sign in as Demo Landowner'}</button>
        <button className="btn btn-dark btn-sm" disabled={busy !== null} onClick={() => void quickSignIn('tenant')}>{busy === 'tenant' ? 'Signing in…' : 'Sign in as Demo Tenant'}</button>
        <Link className="btn btn-outline-dark btn-sm" to="/account">Sign in as yourself (admin)</Link>
      </div>
      {error && <p className="text-danger small mt-2 mb-0" role="alert">{error}</p>}
      <p className="small text-secondary mt-2 mb-0">Demo landowner: <code>{LANDOWNER_EMAIL}</code> · Demo tenant: <code>{TENANT_EMAIL}</code> · Password: <code>{DEMO_PASSWORD}</code></p>
    </div>

    <div className="d-flex flex-column gap-3">
      {steps.map(step => <div className="card p-3" key={step.title}>
        <h2 className="h5 mb-1">{step.title}</h2>
        <p className="small text-secondary mb-2">Account: {step.account}</p>
        {step.body}
      </div>)}
    </div>
  </section>
}
