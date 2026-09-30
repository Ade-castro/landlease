import { Mail, Phone } from 'lucide-react'

export function HelpCentrePage() {
  return <section className="container-xxl py-5" style={{ maxWidth: 640 }}>
    <p className="text-primary fw-bold small text-uppercase">Help centre</p>
    <h1 className="mb-3">Get in touch</h1>
    <p className="text-secondary mb-4">Have a question about listing land, leasing a plot, or using your account? Reach out directly.</p>
    <div className="card p-4">
      <h2 className="h5 mb-3">Brighton Mukundwi &amp; Delvin Vengesai</h2>
      <p className="d-flex align-items-center gap-2 mb-2"><Phone size={16} /> <a href="tel:+263713040845">071 304 0845</a></p>
      <p className="d-flex align-items-center gap-2 mb-0"><Mail size={16} /> <a href="mailto:mukutech@gmail.com">mukutech@gmail.com</a></p>
    </div>
  </section>
}
