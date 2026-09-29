import { Link } from 'react-router-dom'

export function NegotiationPreviewPage() {
  return <section className="container-xxl py-5" style={{ maxWidth: 760 }}>
    <p className="text-primary fw-bold text-uppercase small">Lease terms · Demo preview</p>
    <h1>Negotiation screen</h1>
    <div className="alert alert-warning">Presentation preview using example terms. Nothing here is saved, signed, or offered for lease.</div>
    <div className="card p-4 mb-3">
      <h2 className="h5">Current proposal</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>Example only: USD 180 per month for June to November 2026. Farm visit and borehole access to be agreed. Final boundaries, payment details, and permitted use must be recorded in the agreement.</p>
      <p className="mb-1">Status: <strong>Sent to tenant</strong></p>
      <p className="mb-0 small text-secondary">Tenant has 72 hours to respond after a real proposal is sent.</p>
    </div>
    <div className="card p-4 mb-3">
      <h2 className="h5">Tenant response</h2>
      <div className="d-flex flex-wrap gap-2 mb-3"><button type="button" className="btn btn-primary" disabled>Accept terms</button><button type="button" className="btn btn-outline-danger" disabled>Decline</button></div>
      <label htmlFor="preview-counter">Ask the landowner to revise terms</label>
      <textarea id="preview-counter" className="form-control" rows={3} disabled placeholder="The tenant can write a counterproposal here." />
      <p className="small text-secondary mt-2 mb-0">Controls are disabled in this preview. On a real confirmed visit, the tenant can respond.</p>
    </div>
    <div className="card p-4 mb-3"><h2 className="h5">After acceptance</h2><p className="mb-0">Both parties nominate witnesses, then review the accepted terms. This does not sign a lease.</p></div>
    <Link to="/discover" className="btn btn-outline-primary">Back to Discover</Link>
  </section>
}
